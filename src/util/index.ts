import { Byte } from "../types";
import { CSSColors } from "./css-colors";

export function isHex(color: string) {
  return color[0] === "#";
}

export function isRgb(color: string) {
  return color.substring(0, 3) === "rgb";
}

export function isHsl(color: string) {
  return color.substring(0, 3) === "hsl";
}

export function isCSSColor(color: string) {
  return color in CSSColors;
}

export function rotate(angle: number, by: number) {
  return angle + by >= 360
    ? angle + by - 360
    : angle + by
}

export function normalToByte(normal: number) {
  return Math.round(normal * 255)
}

export function unit(normal: number) {
  return limit(normal, 1);
}


export function byte(byte: number) {
  return limit(byte, 255);
}

export function byte_(byte: number) {
  return limit(Math.round(byte), 255);
}

export function angle(angle: number) {
  return limit(angle, 360);
}

export function angle_(angle: number) {
  return limit(Math.round(angle), 360);
}

export function percentage(pct: number) {
  return limit(pct, 100);
}

export function percentage_(pct: number) {
  return limit(Math.round(pct), 100);
}

export function limit(v: number, max: number) {
  return v > max ? max : v < 0 ? 0 : v;
}

export function fullHex(hex: string) {
  if (hex.length < 4) {
    throw new Error("invalid hex color " + hex);
  }

  return hex.length < 6
    ? "#"
    + hex[1].repeat(2)
    + hex[2].repeat(2)
    + hex[3].repeat(2)
    + hex[4]?.repeat(2) ?? ""
    : hex.substring(0, 9);
}

export function toHex(number: number, minLength: number = 2, max: number = 255) {
  const hex = (number > max ? max : number).toString(16);
  return "0".repeat(minLength - hex.length) + hex;
}

export function HSLtoRGB([h, s, l]: number[]) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    byte(Math.floor(255 * f(0))),
    byte(Math.floor(255 * f(8))),
    byte(Math.floor(255 * f(4))),
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

  return [
    angle(Math.floor(60 * h < 0 ? 60 * h + 360 : 60 * h)),
    percentage(Math.floor(100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0))),
    percentage(Math.floor((100 * (2 * l - s)) / 2)),
  ];
}

export function contrast(Byte: number, value: number) {
  return byte(Math.round(value * (Byte - 128) + 128));
}

export function brightness(Byte: number, value: number) {
  return byte(Math.round(Byte * value));
}

export function solid(byte: number, bg: number, alpha: number) {
  return Math.round((byte * alpha) + (bg * (1 - alpha)));
}
