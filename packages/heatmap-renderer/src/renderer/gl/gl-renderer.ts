import { Renderer } from "../renderer";
import {
  createAndSetupTexture,
  createProgram,
  setFramebuffer,
  setRectangle,
} from "./gl";
import { BaseShape } from "../../shape";

// TODO: don't pass [r, g, b, r, g, b] to the shader but use colors as hex integer
const buildFragmentShader = ({
  paletteSize,
  dither,
}: {
  paletteSize: number;
  dither: boolean;
}) => {
  const lastLutIdx = (paletteSize - 1) * 3;
  return `
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;

// the lookuptable
uniform float u_lut[${paletteSize * 3}];

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

${
  dither
    ? `
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

float dither4x4(vec2 position, float brightness) {
  int x = int(mod(position.x, 4.0));
  int y = int(mod(position.y, 4.0));
  int index = x + y * 4;
  float limit = 0.0;

  if (x < 8) {
    if (index == 0) limit = 0.0625;
    if (index == 1) limit = 0.5625;
    if (index == 2) limit = 0.1875;
    if (index == 3) limit = 0.6875;
    if (index == 4) limit = 0.8125;
    if (index == 5) limit = 0.3125;
    if (index == 6) limit = 0.9375;
    if (index == 7) limit = 0.4375;
    if (index == 8) limit = 0.25;
    if (index == 9) limit = 0.75;
    if (index == 10) limit = 0.125;
    if (index == 11) limit = 0.625;
    if (index == 12) limit = 1.0;
    if (index == 13) limit = 0.5;
    if (index == 14) limit = 0.875;
    if (index == 15) limit = 0.375;
  }

  return brightness < limit ? 0.9 : 1.0;
}

vec3 dither4x4(vec2 position, vec3 color) {
  return color * dither4x4(position, luma(color));
}

vec4 dither4x4(vec2 position, vec4 color) {
  return vec4(color.rgb * dither4x4(position, luma(color)), color.a);
}`
    : ""
}

void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  
  int offset = int(color.a * ${paletteSize}.0);
  
  ${[...Array(paletteSize).keys()]
    .map((_, i) => {
      const offset = i * 3;
      return `if (offset == ${i}) {
      color.rgb = vec3(u_lut[${offset}], u_lut[${offset + 1}], u_lut[${
        offset + 2
      }]);
    }`;
    })
    .join("\n else ")}
    else if (offset >= ${paletteSize}) {
      color.rgb = vec3(u_lut[${lastLutIdx}], u_lut[${lastLutIdx + 1}], u_lut[${
    lastLutIdx + 2
  }]);
    }
    
  ${
    dither
      ? `gl_FragColor = dither4x4(gl_FragCoord.xy, color);`
      : `gl_FragColor = color;`
  }
}`;
};

const vertextShader = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;
uniform float u_flipY;

varying vec2 v_texCoord;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
   vec2 zeroToOne = a_position / u_resolution;

   // convert from 0->1 to 0->2
   vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
   vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);

   // pass the texCoord to the fragment shader
   // The GPU will interpolate this value between points.
   v_texCoord = a_texCoord;
}`;

export class GlRenderer extends Renderer {
  private declare positionLocation: number;
  private declare texcoordLocation: number;

  private declare texcoordBuffer: WebGLBuffer;
  private declare positionBuffer: WebGLBuffer;
  private declare program: WebGLProgram;
  private declare resolutionLocation: WebGLUniformLocation;
  private declare textureSizeLocation: WebGLUniformLocation;
  private declare flipYLocation;
  private declare glImageTexture: WebGLTexture;
  private declare glTexture: WebGLTexture;
  private declare fbo: WebGLFramebuffer;

  destroy(): void {
    this.deleteGlState(true);
    super.destroy();
  }

  render(renderList: BaseShape[]): void {
    this.deleteGlState();

    const {
      options: { min, max },
    } = this.heatmap;
    const { width, height, boundingBox: currentBB } = this;

    this.opacityCtx.clearRect(
      Math.max(0, currentBB.x0),
      Math.max(0, currentBB.y0),
      Math.min(width, currentBB.x1 - currentBB.x0),
      Math.min(height, currentBB.y1 - currentBB.y0)
    );

    const boundingBox = {
      x0: width,
      y0: height,
      x1: 0,
      y1: 0,
    };
    for (const entry of renderList) {
      const brush = this.brushForItem(entry);
      const x0 = entry.x + brush.offsetX;
      const y0 = entry.y + brush.offsetY;
      const x1 = brush.width + x0;
      const y1 = brush.height + y0;

      // don't draw if we're outside the canvas
      if (x0 > width || y0 > height || x1 < 0 || y1 < 0) continue;

      // alpha 0..1
      const opacity = (entry.value - min) / (max - min);

      // workaround small values are not visible because globalAlpha < .01 cannot be read from imageData
      this.opacityCtx.globalAlpha = opacity < 0.01 ? 0.01 : opacity;
      this.opacityCtx.drawImage(brush.canvas, x0, y0);

      if (x0 < boundingBox.x0) {
        boundingBox.x0 = x0;
      }
      if (y0 < boundingBox.y0) {
        boundingBox.y0 = y0;
      }
      if (x1 > boundingBox.x1) {
        boundingBox.x1 = x1;
      }
      if (y1 > boundingBox.y1) {
        boundingBox.y1 = y1;
      }
    }

    this.boundingBox = boundingBox;
    this.glDraw();
  }

  setup(): void {
    const gl = this.colorCtx;
    this.program = createProgram(
      gl,
      vertextShader,
      buildFragmentShader({
        dither: this.heatmap.options.dither,
        paletteSize: this.heatmap.options.paletteSize,
      })
    );

    // Tell it to use our program (pair of shaders)
    gl.useProgram(this.program);

    this.positionLocation = gl.getAttribLocation(this.program, "a_position");
    this.texcoordLocation = gl.getAttribLocation(this.program, "a_texCoord");

    // Create a buffer to put three 2d clip space points in
    this.positionBuffer = gl.createBuffer()!;
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    // Set a rectangle the same size as the image.
    setRectangle(gl, 0, 0, this.width, this.height);

    // provide texture coordinates for the rectangle.
    this.texcoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
      ]),
      gl.STATIC_DRAW
    );

    const lut = gl.getUniformLocation(this.program, "u_lut");

    // set the LUT once
    gl.uniform1fv(lut, this.lutPalette);

    this.resolutionLocation = gl.getUniformLocation(
      this.program,
      "u_resolution"
    )!;
    this.textureSizeLocation = gl.getUniformLocation(
      this.program,
      "u_textureSize"
    )!;
    this.flipYLocation = gl.getUniformLocation(this.program, "u_flipY");
    this.glImageTexture = createAndSetupTexture(gl);
  }

  private deleteGlState(includingSetup: boolean = false) {
    const { colorCtx: gl } = this;
    gl.deleteTexture(this.glTexture);
    gl.deleteFramebuffer(this.fbo);
    if (includingSetup) {
      gl.deleteTexture(this.glImageTexture);
    }
  }
  private glDraw() {
    const gl = this.colorCtx!;

    // Create a texture and put the image in it.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.opacityCanvas
    );

    // create 1 textures and attach them to framebuffers.
    this.glTexture = createAndSetupTexture(gl);

    // make the texture the same size as the image
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.width,
      this.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    // Create a framebuffer
    this.fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

    // Attach a texture to it.
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.glTexture,
      0
    );

    // drawing it
    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Turn on the position attribute
    gl.enableVertexAttribArray(this.positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

    {
      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      const size = 2; // 2 components per iteration
      const type = gl.FLOAT; // the data is 32bit floats
      const normalize = false; // don't normalize the data
      const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      const offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(
        this.positionLocation,
        size,
        type,
        normalize,
        stride,
        offset
      );
    }

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(this.texcoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);

    {
      // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
      const size = 2; // 2 components per iteration
      const type = gl.FLOAT; // the data is 32bit floats
      const normalize = false; // don't normalize the data
      const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      const offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(
        this.texcoordLocation,
        size,
        type,
        normalize,
        stride,
        offset
      );
    }

    // set the size of the image
    gl.uniform2f(this.textureSizeLocation, this.width, this.height);

    // start with the original image
    gl.bindTexture(gl.TEXTURE_2D, this.glImageTexture);

    // don't y flip images while drawing to the textures
    gl.uniform1f(this.flipYLocation, 1);

    // finally draw the result to the canvas.
    gl.uniform1f(this.flipYLocation, -1); // need to y flip for canvas

    setFramebuffer(
      gl,
      this.resolutionLocation,
      null,
      gl.canvas.width,
      gl.canvas.height
    );

    // Draw the rectangle.
    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}
