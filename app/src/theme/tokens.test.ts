import { colors, colorsDark, type ThemeColors } from './tokens';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const themes: [string, ThemeColors][] = [
  ['light', colors],
  ['dark', colorsDark],
];

describe.each(themes)('%s theme', (_name, c) => {
  // [text, background] pairs the charter uses for text.
  const textPairs: [string, string][] = [
    [c.ink, c.paper],
    [c.ink, c.paperLight],
    [c.ink, c.paperWhite],
    [c.muted, c.paper],
    [c.muted, c.paperWhite],
    [c.stamp, c.paper],
    [c.stamp, c.paperWhite],
    [c.onStamp, c.stamp],
    [c.onTabBar, c.tabBar],
    [c.postalText, c.paper],
    [c.brownStamp, c.paper],
  ];

  it.each(textPairs)('text %s on %s reaches 4.5:1', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

it('dark theme defines every light token', () => {
  expect(Object.keys(colorsDark).sort()).toEqual(Object.keys(colors).sort());
});
