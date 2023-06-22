import { BytesRGBA } from "../../types";

export const isHex = (color: string) => color[0] === "#";

export const hexToRGB = (hex: string): BytesRGBA => {
  switch (hex.length) {
    case 4: return shortHexToRGB(hex);
    case 5: return shortHexToRGB(hex);
    case 7: return fullHexToRGB(hex);
    case 9: return fullHexToRGB(hex);
    default: throw new Error("invalid hex color " + hex)
  }
}

export const RGBToHex = (r: number, g: number, b: number) =>
  "#" + byteToHex(r) + byteToHex(g) + byteToHex(b);

export const RGBToHexa = (r: number, g: number, b: number, a: number) =>
  "#" + byteToHex(r) + byteToHex(g) + byteToHex(b) + byteToHex(a);

const byteToHex = (byte: number) => {
  const hex = byte.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

const hexToByte = (hex: string) => parseInt(hex, 16) || 255;

const fullHexToRGB = (hex: string): BytesRGBA => [
  hexToByte(hex[1] + hex[2]),
  hexToByte(hex[3] + hex[4]),
  hexToByte(hex[5] + hex[6]),
  hexToByte(hex[7] + hex[8]),
];

const shortHexToRGB = (hex: string): BytesRGBA => [
  hexToByte(hex[1] + hex[1]),
  hexToByte(hex[2] + hex[2]),
  hexToByte(hex[3] + hex[3]),
  hexToByte(hex[4] + hex[4]),
];
