
if (!globalThis.DOMMatrix) {
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(init?: string | number[]) {
      if (Array.isArray(init)) {
        this.a = init[0]; this.b = init[1]; this.c = init[2];
        this.d = init[3]; this.e = init[4]; this.f = init[5];
      }
    }
    multiply(other: DOMMatrix) { return this; }
    translate(x: number, y: number) { return this; }
    scale(x: number, y: number) { return this; }
    transformPoint(point: {x: number, y: number}) { return point; }
    toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
  } as any;
}
