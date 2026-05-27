export function generateRandomColor() {
  return {
    hue: Math.floor(Math.random() * 361),
    saturation: Math.floor(45 + Math.random() * 56),
    brightness: Math.floor(35 + Math.random() * 61)
  };
}

export function generateColorSet(amount = 5) {
  return Array.from({ length: amount }, generateRandomColor);
}

export function hsbToRgb({ hue, saturation, brightness }) {
  const s = saturation / 100;
  const v = brightness / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hue < 60) {
    r1 = c;
    g1 = x;
  } else if (hue < 120) {
    r1 = x;
    g1 = c;
  } else if (hue < 180) {
    g1 = c;
    b1 = x;
  } else if (hue < 240) {
    g1 = x;
    b1 = c;
  } else if (hue < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

export function hsbToCss(color) {
  const { r, g, b } = hsbToRgb(color);
  return `rgb(${r}, ${g}, ${b})`;
}

export function calculateColorScore(original, attempt) {
  const originalRgb = hsbToRgb(original);
  const attemptRgb = hsbToRgb(attempt);
  const distance = Math.sqrt(
    (originalRgb.r - attemptRgb.r) ** 2 +
      (originalRgb.g - attemptRgb.g) ** 2 +
      (originalRgb.b - attemptRgb.b) ** 2
  );

  const maxDistance = Math.sqrt(3 * 255 ** 2);
  const score = Math.max(0, 10 - (distance / maxDistance) * 10);

  return Number(score.toFixed(1));
}
