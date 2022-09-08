export function createShader(
  gl: WebGLRenderingContext,
  str: string,
  type: GLenum
) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, str);
  gl.compileShader(shader);
  return shader;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vstr: string,
  fstr: string
) {
  const program = gl.createProgram()!;
  const vshader = createShader(gl, vstr, gl.VERTEX_SHADER);
  const fshader = createShader(gl, fstr, gl.FRAGMENT_SHADER);
  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);
  return program;
}

export function setRectangle(
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

export function createAndSetupTexture(gl: WebGLRenderingContext): WebGLTexture {
  var texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set up texture so we can render any size image and so we are
  // working with pixels.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture;
}

export function setFramebuffer(
  gl: WebGLRenderingContext,
  resolutionLocation: WebGLUniformLocation,
  fbo: WebGLFramebuffer | null,
  width: number,
  height: number
) {
  // make this the framebuffer we are rendering to.
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  // Tell the shader the resolution of the framebuffer.
  gl.uniform2f(resolutionLocation, width, height);

  // Tell webgl the viewport setting needed for framebuffer.
  gl.viewport(0, 0, width, height);
}
