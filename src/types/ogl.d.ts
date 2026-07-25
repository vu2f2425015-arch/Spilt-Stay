declare module 'ogl' {
  export class Renderer {
    constructor(options?: any);
    gl: WebGLRenderingContext;
    setSize(width: number, height: number): void;
    render(options: { scene: any; camera?: any }): void;
  }
  export class Program {
    constructor(gl: WebGLRenderingContext, options: any);
    uniforms: Record<string, { value: any }>;
  }
  export class Mesh {
    constructor(gl: WebGLRenderingContext, options: { geometry: any; program: any });
  }
  export class Color {
    constructor(r?: number, g?: number, b?: number);
  }
  export class Triangle {
    constructor(gl: WebGLRenderingContext);
  }
}
