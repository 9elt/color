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

// smaller than the smallest rbg color string
//
// Color            =   16 bit * 8   =  128 bit
//
// "rgb(0, 0, 0)"   =   16 bit * 12  =  192 bit

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

    // ensures that the hsl values are up to date

    hsl(): void {
        if (this[MODEL] & HSL)
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

    // ensures that the rgb values are up to date

    rgb(): void {
        if (this[MODEL] & RGB)
            return;

        let h = this[H];
        let s = this[S];
        let l = this[L];

        s /= 100; l /= 100;
        s = s * Math.min(l, 1 - l);

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

// all methods modify the color in place,
// it is up to the user to clone the color if needed `new Color(color)`

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

export function opacity(color: Color, a = 1): void {
    color[A] = a * 255;
}

export function lightness(color: Color, stren = 1): void {
    color.hsl();

    color[L] = stren * 100;

    color[MODEL] = HSL;
}

export function rotateHue(color: Color, deg: number): void {
    color.hsl();

    color[H] = (color[H] + deg) % 360;

    color[MODEL] = HSL;
}

export function saturate(color: Color, stren = 1): void {
    color.hsl();

    color[S] = stren * 100;

    color[MODEL] = HSL;
}

export function invert(color: Color): void {
    if (color[MODEL] & RGB) {
        color[R] = 255 - color[R];
        color[G] = 255 - color[G];
        color[B] = 255 - color[B];

        color[MODEL] = RGB;
    }
    else if (color[MODEL] & HSL) {
        color[H] = (color[H] + 180) % 360;
        color[S] = 100 - color[S];
        color[L] = 100 - color[L];

        color[MODEL] = HSL;
    }
}
