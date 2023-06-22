import { unit, angle_, pct_, rotate_ } from "./util";

import type { Unit, Angle, Percentage, HSLAbytes, BaseColor } from "./types";
import type { RGBa } from "./rgb";

export class HSLa implements BaseColor {
  #bytes: HSLAbytes;

  constructor(hsla: HSLAbytes) { this.#bytes = hsla; }

  get h(): Angle { return this.#bytes[0] }
  get s(): Percentage { return this.#bytes[1] }
  get l(): Percentage { return this.#bytes[2] }
  get a(): Unit { return this.#bytes[3] }

  get bytes(): HSLAbytes { return this.#bytes }

  get alpha() { return this.a; }
  get hasAlpha() { return this.a !== 1 }

  static fromRGBa(rgba: RGBa) {
    let [r, g, b, a] = rgba.bytes;

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

    return new HSLa([
      angle_(60 * h < 0 ? 60 * h + 360 : 60 * h),
      pct_(100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0)),
      pct_((100 * (2 * l - s)) / 2),
      unit(a / 255)
    ])
  }

  opacity(value: number) {
    this.#bytes[3] = unit(this.a * value);
  }

  rotateHue(deg: number) {
    this.#bytes[0] = rotate_(this.h, deg);
  }

  saturate(value: number) {
    this.#bytes[1] = pct_(this.s * value);
  }

  invert() {
    this.#bytes[0] = rotate_(this.h, 180);
    this.#bytes[1] = 100 - this.s;
    this.#bytes[2] = 100 - this.l;
  }

  clone() {
    return new HSLa([...this.#bytes]);  
  }
}
