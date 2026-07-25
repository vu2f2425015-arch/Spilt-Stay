// Self-contained WebGL rendering helper for Galaxy background (Zero external dependencies)
export class Color extends Array<number> {
  constructor(r = 0, g = 0, b = 0) {
    super(3);
    this[0] = r;
    this[1] = g;
    this[2] = b;
  }
  get r() { return this[0]; }
  set r(v) { this[0] = v; }
  get g() { return this[1]; }
  set g(v) { this[1] = v; }
  get b() { return this[2]; }
  set b(v) { this[2] = v; }
}

export class Triangle {
  gl: WebGLRenderingContext;
  attributes: Record<string, { buffer: WebGLBuffer; size: number }>;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const position = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const uv = new Float32Array([0, 0, 2, 0, 0, 2]);

    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

    const uvBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);

    this.attributes = {
      position: { buffer: posBuf, size: 2 },
      uv: { buffer: uvBuf, size: 2 }
    };
  }
}

export class Renderer {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;

  constructor({ alpha = true, premultipliedAlpha = false } = {}) {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl', { alpha, premultipliedAlpha }) ||
      canvas.getContext('experimental-webgl', { alpha, premultipliedAlpha })) as WebGLRenderingContext;
    this.canvas = canvas;
    this.gl = gl;
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  render({ scene }: { scene: Mesh }) {
    scene.draw();
  }
}

export class Program {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, { value: any }>;

  constructor(gl: WebGLRenderingContext, { vertex, fragment, uniforms = {} }: { vertex: string; fragment: string; uniforms?: any }) {
    this.gl = gl;
    this.uniforms = uniforms;

    const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertShader, vertex);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragShader, fragment);
    gl.compileShader(fragShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    this.program = program;
  }
}

export class Mesh {
  gl: WebGLRenderingContext;
  geometry: Triangle;
  program: Program;

  constructor(gl: WebGLRenderingContext, { geometry, program }: { geometry: Triangle; program: Program }) {
    this.gl = gl;
    this.geometry = geometry;
    this.program = program;
  }

  draw() {
    const { gl, geometry, program } = this;
    gl.useProgram(program.program);

    // Bind attributes
    for (const name in geometry.attributes) {
      const attr = geometry.attributes[name];
      const loc = gl.getAttribLocation(program.program, name);
      if (loc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, attr.size, gl.FLOAT, false, 0, 0);
      }
    }

    // Set uniforms
    for (const name in program.uniforms) {
      const u = program.uniforms[name];
      const loc = gl.getUniformLocation(program.program, name);
      if (!loc) continue;

      const val = u.value;
      if (typeof val === 'number') {
        gl.uniform1f(loc, val);
      } else if (typeof val === 'boolean') {
        gl.uniform1i(loc, val ? 1 : 0);
      } else if (val instanceof Color) {
        gl.uniform3f(loc, val[0], val[1], val[2]);
      } else if (val instanceof Float32Array) {
        if (val.length === 2) gl.uniform2fv(loc, val);
        else if (val.length === 3) gl.uniform3fv(loc, val);
      }
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
