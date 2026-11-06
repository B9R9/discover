// Removes the metadata of a JPEG before it leaves the phone: EXIF (GPS position, camera, date),
// XMP, comments and every other application segment. Only what the picture needs stays: the
// JFIF header, the color profile, and a new EXIF holding the orientation alone, so that a portrait
// photo does not come out sideways.

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP0 = 0xe0;
const APP1 = 0xe1;
const APP2 = 0xe2;
const ORIENTATION_TAG = 0x0112;
const ICC_SIGNATURE = 'ICC_PROFILE\0';
const EXIF_SIGNATURE = 'Exif\0\0';

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

// Markers that stand alone, without a length field.
function hasNoLength(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7) || marker === SOI || marker === EOI;
}

// The orientation (1 to 8) stored in an EXIF segment, or null. `start` is the first byte after the length.
export function readOrientation(bytes: Uint8Array, start: number, end: number): number | null {
  if (ascii(bytes, start, 6) !== EXIF_SIGNATURE) return null;
  const tiff = start + 6;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const little = ascii(bytes, tiff, 2) === 'II';
  if (!little && ascii(bytes, tiff, 2) !== 'MM') return null;
  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > end) return null;
  const count = view.getUint16(ifd, little);
  for (let index = 0; index < count; index++) {
    const entry = ifd + 2 + index * 12;
    if (entry + 12 > end) return null;
    if (view.getUint16(entry, little) === ORIENTATION_TAG) {
      const value = view.getUint16(entry + 8, little);
      return value >= 1 && value <= 8 ? value : null;
    }
  }
  return null;
}

function orientationSegment(orientation: number): number[] {
  return [
    0xff,
    APP1,
    0x00,
    0x22,
    ...[...EXIF_SIGNATURE].map((char) => char.charCodeAt(0)),
    0x4d,
    0x4d,
    0x00,
    0x2a,
    0x00,
    0x00,
    0x00,
    0x08, // big-endian TIFF header, first IFD at 8
    0x00,
    0x01, // one entry
    0x01,
    0x12,
    0x00,
    0x03,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    orientation,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00, // no next IFD
  ];
}

// Throws on anything that is not a well-formed JPEG: better to refuse than to send it unchecked.
export function stripJpeg(input: Uint8Array): Uint8Array {
  if (input.length < 4 || input[0] !== 0xff || input[1] !== SOI) throw new Error('Not a JPEG');

  const kept: number[][] = [];
  let orientation: number | null = null;
  let position = 2;
  let imageStart = -1;

  while (position < input.length && imageStart === -1) {
    if (input[position] !== 0xff) throw new Error('Broken JPEG segment');
    const marker = input[position + 1];
    if (marker === undefined) throw new Error('Truncated JPEG');
    if (marker === 0xff) {
      position += 1; // fill byte
      continue;
    }
    if (hasNoLength(marker)) {
      kept.push([0xff, marker]);
      position += 2;
      continue;
    }
    if (position + 4 > input.length) throw new Error('Truncated JPEG');
    const length = (input[position + 2] ?? 0) * 256 + (input[position + 3] ?? 0);
    const end = position + 2 + length;
    if (length < 2 || end > input.length) throw new Error('Truncated JPEG');

    if (marker === SOS) {
      imageStart = position;
      break;
    }
    const body = position + 4;
    if (marker === APP1) {
      orientation ??= readOrientation(input, body, end);
    } else if (
      marker === APP0 ||
      (marker === APP2 && ascii(input, body, ICC_SIGNATURE.length) === ICC_SIGNATURE)
    ) {
      kept.push([...input.subarray(position, end)]);
    } else if (marker < 0xe0 || marker > 0xef) {
      if (marker !== 0xfe) kept.push([...input.subarray(position, end)]);
    }
    position = end;
  }
  if (imageStart === -1) throw new Error('JPEG without image data');

  const head: number[] = [0xff, SOI];
  // Right after the start marker, as the EXIF standard wants.
  if (orientation !== null) head.push(...orientationSegment(orientation));
  const body = kept.filter((segment) => !(segment.length === 2 && segment[1] === SOI)).flat();
  const output = new Uint8Array(head.length + body.length + (input.length - imageStart));
  output.set(head, 0);
  output.set(body, head.length);
  output.set(input.subarray(imageStart), head.length + body.length);
  return output;
}
