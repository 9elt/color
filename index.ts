export const R = 0;
export const G = 1;
export const B = 2;
export const A = 3;
export const H = 4;
export const S = 5;
export const L = 6;

export const MODEL = 7;

export const RGB = 1;
export const HSL = 2;

// Lazily implements Rgb and Hsl color models
//
// `this[MODEL]` specifies the up-to-date models
// `RGB`, `HSL` or `HSL | RGB` (both)

export class Color extends Uint16Array {
    constructor(color: Color);

    constructor(r?: number, g?: number, b?: number, a?: number);

    constructor(
        r: number | Color = 255,
        g: number = 255,
        b: number = 255,
        a: number = 255
    ) {
        super(8);

        if (r instanceof Color) {
            for (let i = 0; i < 8;) {
                this[i] = r[i++];
            }
        }
        else {
            this[R] = r;
            this[G] = g;
            this[B] = b;
            this[A] = a;
            this[MODEL] = RGB;
        }
    }

    toString(): string {
        return this[MODEL] & RGB
            ? 'rgba('
            + this[R] + ','
            + this[G] + ','
            + this[B] + ','
            + (this[A] / 255).toFixed(2) +
            ')'
            : 'hsla('
            + this[H] + ','
            + this[S] + '%,'
            + this[L] + '%,'
            + (this[A] / 255).toFixed(2) +
            ')';
    }

    hsl(): void {
        if (this[MODEL] & HSL)

            // HSL already up to date
            return;

        let r = this[R] / 255;
        let g = this[G] / 255;
        let b = this[B] / 255;

        let l = Math.max(r, g, b);
        let s = l - Math.min(r, g, b);
        let h = 0;

        if (s !== 0)
            switch (l) {
                case r: h = (g - b) / s; break;
                case g: h = (b - r) / s + 2; break;
                case b: h = (r - g) / s + 4; break;
            };

        this[H] = 60 * h < 0 ? 60 * h + 360 : 60 * h;
        this[S] = 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0);
        this[L] = (100 * (2 * l - s)) / 2;

        this[MODEL] |= HSL;
    }

    rgb(): void {
        if (this[MODEL] & RGB)

            // RGB already up to date
            return;

        let h = this[H];
        let l = this[L] / 100;
        let s = (this[S] / 100) * Math.min(l, 1 - l);

        const f = (n: number) => {
            n = (n + h / 30) % 12;
            return 255 * (l - s * Math.max(-1, Math.min(n - 3, 9 - n, 1)));
        };

        this[R] = f(0);
        this[G] = f(8);
        this[B] = f(4);

        this[MODEL] |= RGB;
    }
}

export function luma(color: Color): number {
    color.rgb();

    return 0.2126 * color[R] + 0.7152 * color[G] + 0.0722 * color[B];
}

export function contrast(a: Color, b: Color): number {
    const luma_a = luma(a);
    const luma_b = luma(b);

    return (Math.max(luma_a, luma_b) + 0.05) / (Math.min(luma_a, luma_b) + 0.05);
}

// Y′UV https://en.wikipedia.org/wiki/Y%E2%80%B2UV

export function lumaYUV(color: Color): number {
    color.rgb();

    return 0.299 * color[R] + 0.587 * color[G] + 0.114 * color[B];
}

export function isDark(color: Color): boolean {
    return lumaYUV(color) < 128;
}

export function isLight(color: Color): boolean {
    return lumaYUV(color) >= 128;
}

// All methods modify colors in place, it is
// up to the user to clone them if needed `new Color(color)`

export function mix(into: Color, from: Color, stren: number = 0.5): void {
    into.rgb();
    from.rgb();

    const istren = 1 - stren;

    into[R] = into[R] * istren + from[R] * stren;
    into[G] = into[G] * istren + from[G] * stren;
    into[B] = into[B] * istren + from[B] * stren;
    into[A] = into[A] * istren + from[A] * stren;

    into[MODEL] = RGB;
}

export function opacity(color: Color, stren = 1): void {
    color[A] = stren * 255;
}

export function hue(color: Color, deg = 360): void {
    color.hsl();

    color[H] = deg;

    color[MODEL] = HSL;
}

export function saturation(color: Color, perc = 100): void {
    color.hsl();

    color[S] = perc;

    color[MODEL] = HSL;
}

export function lightness(color: Color, perc = 100): void {
    color.hsl();

    color[L] = perc;

    color[MODEL] = HSL;
}

export function rotateHue(color: Color, deg = 180): void {
    color.hsl();

    color[H] = (color[H] + deg) % 360;
    color[H] < 0 && (color[H] += 360);

    color[MODEL] = HSL;
}

export function invert(color: Color): void {
    color.rgb();

    color[R] = 255 - color[R];
    color[G] = 255 - color[G];
    color[B] = 255 - color[B];

    color[MODEL] = RGB;
}

export function invertHsl(color: Color): void {
    color.hsl();

    color[H] = (color[H] + 180) % 360;
    color[H] < 0 && (color[H] += 360);

    color[S] = 100 - color[S];
    color[L] = 100 - color[L];

    color[MODEL] = HSL;
}
