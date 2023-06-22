export type FilterMethod = keyof FilterOptions;

export type FilterOptions = {
  contrast: number;
  hueRotate: number;
  saturation: number;
  brightness: number;
  opacity: number;
  invert: true;
  solid: true;
}

type Enm<N extends number, Acc extends number[] = []> = 
Acc['length'] extends N
  ? Acc[number]
  : Enm<N, [...Acc, Acc['length']]>

type IntRange<F extends number, T extends number> = Exclude<Enm<T>, Enm<F>>

export type Byte = number
export type Percentage = number
export type Angle = number

export type BytesRGB = [Byte, Byte, Byte];
export type BytesRGBA = [Byte, Byte, Byte, Byte];

export type BytesHSL = [Angle, Percentage, Percentage];
export type BytesHSLA = [Angle, Percentage, Percentage, number];
