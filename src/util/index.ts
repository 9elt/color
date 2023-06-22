import type { RGBAbytes, HSLAbytes, Percentage, Angle, Byte } from "../types";

export type { CSSColors } from "./css-colors";
export { CSSColor, isCSSColor } from "./css-colors";

export const isHex = (color: string) => color[0] === "#";
export const isRgb = (color: string) => color.substring(0, 3) === "rgb";
export const isHsl = (color: string) => color.substring(0, 3) === "hsl";


// hex parsing

export const hexToRGB = (hex: string): RGBAbytes => {
  switch (hex.length) {
    case 4: return shortHexToRGB(hex);
    case 5: return shortHexToRGB(hex);
    case 7: return fullHexToRGB(hex);
    case 9: return fullHexToRGB(hex);
    default: throw new Error("invalid hex color " + hex)
  }
}

export const RGBToHex = ([r, g, b]: RGBAbytes) =>
  "#" + toHex(r) + toHex(g) + toHex(b);

export const RGBToHexa = ([r, g, b, a]: RGBAbytes) =>
  "#" + toHex(r) + toHex(g) + toHex(b) + toHex(a);

const toHex = (byte: number) => {
  const hex = byte.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

const hexToByte = (hex: string) => {
  let int = parseInt(hex, 16)
  return isNaN(int) ? 255 : int
};

const fullHexToRGB = (hex: string): RGBAbytes => [
  hexToByte(hex[1] + hex[2]),
  hexToByte(hex[3] + hex[4]),
  hexToByte(hex[5] + hex[6]),
  hexToByte(hex[7] + hex[8]),
];

const shortHexToRGB = (hex: string): RGBAbytes => [
  hexToByte(hex[1] + hex[1]),
  hexToByte(hex[2] + hex[2]),
  hexToByte(hex[3] + hex[3]),
  hexToByte(hex[4] + hex[4]),
];


// hsl parsing

export const hslToHSL = (color: string): HSLAbytes => {
  let [clr, a] = color.split("(")[1]?.split(")")[0]?.split("/");

  if (!clr) {
    throw new Error("invalid hsl color " + color);
  }

  let data = clr.split(" ");

  if (data.length < 3) {
    throw new Error("invalid hsl color " + color);
  }

  let alpha = parseFloat(a?.replace("%", "")) || 1;
  alpha = unit(alpha > 1 ? alpha / 100 : alpha);

  return [
    parseInt(data[0]),
    parseInt(data[1]),
    parseInt(data[2]),
    alpha
  ];
}

export const HSLtoHsl = ([h, s, l]: HSLAbytes) => `hsl(${h} ${s}% ${l}%)`;
export const HSLtoHsla = ([h, s, l, a]: HSLAbytes) => `hsla(${h} ${s}% ${l}% / ${a.toFixed(2)})`;


// rbg parsing

export const rgbToRGB = (color: string): RGBAbytes => {
  let rgb = color.split("(")[1]?.split(")")[0]?.split(",");

  if (!rgb || rgb.length < 3) {
    throw new Error("invalid rgb color " + color);
  }

  return [
    parseInt(rgb[0]),
    parseInt(rgb[1]),
    parseInt(rgb[2]),
    byte_((parseFloat(rgb[3]) || 1) * 255),
  ];
}

export const RGBToRgb = ([r, g, b]: RGBAbytes) => `rgb(${r},${g},${b})`;
export const RGBToRgba = ([r, g, b, a]: RGBAbytes) => `rgba(${r},${g},${b},${(a / 255).toFixed(2)})`;


// clamping

export const unit = (n: number) => limit(n, 1);

export const byte = (b: number): Byte => limit(b, 255);
export const byte_ = (b: number): Byte => byte(Math.round(b));

export const angle = (d: number): Angle => limit(d, 360);
export const angle_ = (d: number): Angle => angle(Math.round(d));

export const pct = (p: number): Percentage => limit(p, 100);
export const pct_ = (p: number): Percentage => pct(Math.round(p));

export const limit = (v: number, max: number) => v > max ? max : v < 0 ? 0 : v;

export const rotate_ = (angle: Angle, deg: number): Angle => {
  return angle + deg > 359 ? angle + deg - 359 : angle + deg
}


// rgb byte filters

export const contrast = (byte: number, value: number) =>
  byte_(value * (byte - 128) + 128);

export const brightness = (byte: number, value: number) =>
  byte_(byte * value)

export const solid = (byte: number, bg: number, alpha: number) =>
  byte_((byte * alpha) + (bg * (1 - alpha)));


// luma

export const luma = ([r, g, b, a]: RGBAbytes, YUV = false) => {
  return (
    (YUV ? 0.299 : 0.2126) * r
    + (YUV ? 0.587 : 0.7152) * g
    + (YUV ? 0.114 : 0.0722) * b
  ) / 255;
}

export const lumaAlpha = (
  [r, g, b, a]: RGBAbytes,
  [r_, g_, b_]: number[] = [255, 255, 255],
  YUV = false
) => {
  return (
    (YUV ? 0.299 : 0.2126) * solid(r, r_, a)
    + (YUV ? 0.587 : 0.7152) * solid(g, g_, a)
    + (YUV ? 0.114 : 0.0722) * solid(b, b_, a)
  ) / 255;
}
