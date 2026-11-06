import { readOrientation, stripJpeg } from './stripJpeg';

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === 'string' ? [...part].map((c) => c.charCodeAt(0)) : part,
    ),
  );

function segment(marker: number, content: Uint8Array | number[] | string): number[] {
  const data = typeof content === 'string' ? [...bytes(content)] : [...content];
  const length = data.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...data];
}

// An EXIF segment with an orientation, a GPS pointer and GPS data (a position written as text).
function exifWithGps(orientation: number): number[] {
  const tiff = [
    0x49,
    0x49,
    0x2a,
    0x00,
    0x08,
    0x00,
    0x00,
    0x00, // little-endian, IFD at 8
    0x02,
    0x00, // two entries
    0x12,
    0x01,
    0x03,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    orientation,
    0x00,
    0x00,
    0x00,
    0x25,
    0x88,
    0x04,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x1e,
    0x00,
    0x00,
    0x00, // GPS IFD pointer
    0x00,
    0x00,
    0x00,
    0x00,
    ...bytes('GPSLAT=44.4N GPSLON=1.2W'),
  ];
  return segment(0xe1, [...bytes('Exif\0\0'), ...tiff]);
}

const image = [0xff, 0xda, 0x00, 0x08, 1, 2, 3, 4, 5, 6, 0xff, 0xd9];

function photo(exif: number[]): Uint8Array {
  return bytes(
    [0xff, 0xd8],
    segment(0xe0, 'JFIF\0\x01\x01\0\0\x01\0\x01\0\0'),
    exif,
    segment(0xe1, 'http://ns.adobe.com/xap/1.0/\0<x:xmpmeta lat="44.4"/>'),
    segment(0xfe, 'Shot on a phone'),
    segment(0xe3, 'maker note'),
    segment(0xdb, [0, 1, 2, 3]),
    image,
  );
}

const text = (data: Uint8Array) => String.fromCharCode(...data);

test('removes the GPS position, XMP, comments and other application segments', () => {
  const output = text(stripJpeg(photo(exifWithGps(6))));
  for (const secret of ['GPSLAT', '44.4', 'xmpmeta', 'Shot on a phone', 'maker note']) {
    expect(output).not.toContain(secret);
  }
});

test('keeps the picture: JFIF header, tables and image data', () => {
  const output = stripJpeg(photo(exifWithGps(6)));
  expect(text(output)).toContain('JFIF');
  expect([...output.subarray(output.length - image.length)]).toEqual(image);
  expect(output[0]).toBe(0xff);
  expect(output[1]).toBe(0xd8);
});

test('keeps the orientation so the photo is not turned', () => {
  for (const orientation of [1, 3, 6, 8]) {
    const output = stripJpeg(photo(exifWithGps(orientation)));
    // The new EXIF is the first segment after the start marker.
    expect(output[2]).toBe(0xff);
    expect(output[3]).toBe(0xe1);
    expect(readOrientation(output, 6, output.length)).toBe(orientation);
  }
});

test('adds no EXIF when the photo had no orientation', () => {
  const output = stripJpeg(photo([]));
  expect(output[3]).not.toBe(0xe1);
});

test('refuses what is not a well-formed JPEG', () => {
  expect(() => stripJpeg(bytes('not a jpeg'))).toThrow();
  expect(() => stripJpeg(bytes([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x50, 1]))).toThrow();
  expect(() => stripJpeg(bytes([0xff, 0xd8, 0xff, 0xd9]))).toThrow();
});
