import { contrast, brightness, solid, byte_ } from "./util";
import type { Byte, RGBAbytes, BaseColor } from "./types";
import type { HSLa } from "./hsl";

export class RGBa implements BaseColor {
  #bytes: RGBAbytes;

  constructor(rgba: RGBAbytes) {
    this.#bytes = rgba;
  }

  get r(): Byte { return this.#bytes[0]; }
  get g(): Byte { return this.#bytes[1]; }
  get b(): Byte { return this.#bytes[2]; }
  get a(): Byte { return this.#bytes[3]; }

  get bytes(): RGBAbytes { return this.#bytes }

  get alpha() { return this.a / 255; }
  get hasAlpha() { return this.a !== 255 }

  static fromHSLa(hsla: HSLa) {
    let [h, s, l, a] = hsla.bytes;

    s /= 100; l /= 100;
    s = s * Math.min(l, 1 - l);

    return new RGBa([
      byte_(255 * this.#f(0, h, l, s)),
      byte_(255 * this.#f(8, h, l, s)),
      byte_(255 * this.#f(4, h, l, s)),
      byte_(a * 255)
    ]);
  }

  static #f(n: number, h: number, l: number, a: number) {
    n = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(n - 3, 9 - n, 1))
  }

  contrast(value: number) {
    this.#bytes[0] = contrast(this.r, value);
    this.#bytes[1] = contrast(this.g, value);
    this.#bytes[2] = contrast(this.b, value);
  }

  brightness(value: number) {
    this.#bytes[0] = brightness(this.r, value);
    this.#bytes[1] = brightness(this.g, value);
    this.#bytes[2] = brightness(this.b, value);
  }

  opacity(value: number) {
    this.#bytes[3] = byte_(value * 255);
  }

  solid([r_, g_, b_]: number[] = [255, 255, 255]) {
    this.#bytes[0] = solid(this.r, r_, this.alpha);
    this.#bytes[1] = solid(this.g, g_, this.alpha);
    this.#bytes[2] = solid(this.b, b_, this.alpha);
    this.#bytes[3] = 255;
  }

  invert() {
    this.#bytes[0] = 255 - this.r;
    this.#bytes[1] = 255 - this.g;
    this.#bytes[2] = 255 - this.b;
  }

  clone() {
    return new RGBa([...this.#bytes]);
  }
}
