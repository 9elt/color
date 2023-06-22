export type { CSSColors } from "./util"

export type FilterMethod = keyof FilterOptions;

export type FilterOptions = {
  contrast: number;
  rotateHue: number;
  saturation: number;
  brightness: number;
  opacity: number;
  invert: true;
  invertHSL: true,
  solid: true;
}

export type Unit = number
export type Byte = number
export type Percentage = number
export type Angle = number

export type RGBAbytes = [Byte, Byte, Byte, Byte];
export type HSLAbytes = [Angle, Percentage, Percentage, number];

export interface BaseColor {
  alpha: number
  hasAlpha: boolean
  opacity: (value: number) => void
  invert: () => void
}
