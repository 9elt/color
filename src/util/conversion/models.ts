import { byte_, angle_, percentage_ } from "..";

const f = (n: number, h: number, l: number, a: number) => {
  n = (n + h / 30) % 12;
  return l - a * Math.max(-1, Math.min(n - 3, 9 - n, 1))
}

export function HSLtoRGB([h, s, l]: number[]) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  return [
    byte_(255 * f(0, h, l, a)),
    byte_(255 * f(8, h, l, a)),
    byte_(255 * f(4, h, l, a)),
  ];
}

export function RGBtoHSL([r, g, b]: number[]) {
  r /= 255; g /= 255; b /= 255;

  let l = Math.max(r, g, b);
  let s = l - Math.min(r, g, b);
  let h = 0;

  if (s !== 0) {
    switch (l) {
      case r: h = (g - b) / s; break;
      case g: h = (b - r) / s + 2; break;
      case b: h = (r - g) / s + 4; break;
    }
  }

  let c = (2 * l - s);
  let hue = 60 * h;

  return [
    angle_(hue < 0 ? hue + 360 : hue),
    percentage_(100 * (l <= 0.5 ? s / c : s / (2 - c))),
    percentage_(50 * c),
  ];
}
