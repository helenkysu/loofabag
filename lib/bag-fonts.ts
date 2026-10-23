// Fonts printed on the bag: Space Grotesk for the phrase above the QR, Space Mono for
// the loofabag.com/<slug> URL below it. Both are loaded by the Google Fonts @import in
// globals.css; canvases must wait for them (ensureBagFonts) or they'd draw a fallback.

export const bagTextFont = (px: number) => `700 ${px}px "Space Grotesk", Arial, sans-serif`;
export const bagUrlFont = (px: number) => `700 ${px}px "Space Mono", "Courier New", monospace`;

export async function ensureBagFonts(): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    await Promise.all([document.fonts.load(bagTextFont(40)), document.fonts.load(bagUrlFont(40))]);
  } catch { /* fall back to the system fonts in the stack */ }
}
