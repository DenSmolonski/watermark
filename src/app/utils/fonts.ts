export interface IFontItem {
  id: string;
  name: string;
  fontFamily: string;
}

const fonts: Array<string> = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Gill Sans, sans-serif',
  'Lucida, sans-serif',
  'Helvetica Narrow, sans-serif',
  'sans-serif',
  'Times, serif',
  'Times New Roman, serif',
  'Palatino, serif',
  'Bookman, serif',
  'New Century Schoolbook, serif',
  'serif',
  'Andale Mono, monospace',
  'Courier New, monospace',
  'Courier, monospace',
  'Lucidatypewriter, monospace',
  'Fixed, monospace',
  'monospace',
  'Comic Sans, cursive',
  'Zapf Chancery, cursive',
  'Coronetscript, cursive',
  'Florence, cursive',
  'Parkavenue, cursive',
  'cursive',
  'Impact, fantasy',
  'Arnoldboecklin, fantasy',
  'Oldtown, fantasy',
  'Blippo, fantasy',
  'Brushstroke, fantasy',
  'fantasy',
];

export const availableFonts = (): Array<IFontItem> => {
  return fonts.map((font) => ({
    id: font.replace(' ', ''),
    name: font,
    fontFamily: font,
  }));
};
