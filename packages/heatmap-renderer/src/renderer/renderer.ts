import { BaseShape } from "../shape";
import { Heatmap } from "../heatmap";

export abstract class Renderer {
  abstract setup(): void;
  abstract render(renderList: BaseShape[]): void;

  private colorCanvas: HTMLCanvasElement = document.createElement("canvas");
  protected opacityCanvas: HTMLCanvasElement = document.createElement("canvas");
  private paletteCanvas: HTMLCanvasElement = document.createElement("canvas");

  protected boundingBox: { x0: number; y0: number; x1: number; y1: number } = {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
  };

  public width: number;
  public height: number;

  protected colorCtx = this.colorCanvas.getContext("webgl", {
    premultipliedAlpha: false,
  })!;
  protected opacityCtx = this.opacityCanvas.getContext("2d")!;
  protected paletteCtx = this.paletteCanvas.getContext("2d")!;

  public lutPalette: number[] = [];

  constructor(private container: HTMLElement, protected heatmap: Heatmap) {
    this.lutPalette = this.buildPalette();

    const computed = getComputedStyle(container);
    container.style.position = "relative";
    this.colorCanvas.style.cssText =
      "position:absolute;top:0;right:0;bottom:0;left:0;";

    container.append(this.colorCanvas);
    if (this.heatmap.options.debug) {
      this.opacityCanvas.style.cssText =
        "position:absolute;top:0;right:0;bottom:0;left:0;transform:translateY(100%);";
      this.paletteCanvas.style.cssText =
        "position:absolute;top:1px;right:0;bottom:0;left:0;transform:translateY(-100%);height:1px;";
      container.append(this.opacityCanvas);
      container.append(this.paletteCanvas);
    }

    this.colorCanvas.width = +computed.width.replace(/px/, "");
    this.colorCanvas.height = +computed.height.replace(/px/, "");
    this.opacityCanvas.width = this.colorCanvas.width;
    this.opacityCanvas.height = this.colorCanvas.height;
    this.width = this.colorCanvas.width;
    this.height = this.colorCanvas.height;

    // create "inverted" bound box to always get a smaller first box
    this.boundingBox = {
      x0: this.width,
      y0: this.height,
      x1: 0,
      y1: 0,
    };
  }

  public destroy() {
    this.container.removeChild(this.colorCanvas);
    if (this.heatmap.options.debug) {
      this.container.removeChild(this.opacityCanvas);
      this.container.removeChild(this.paletteCanvas);
    }

    // @ts-ignore
    this.colorCanvas = undefined;
    // @ts-ignore
    this.opacityCanvas = undefined;
    // @ts-ignore
    this.paletteCanvas = undefined;
    // @ts-ignore
    this.colorCtx = undefined;
    // @ts-ignore
    this.opacityCtx = undefined;
    // @ts-ignore
    this.paletteCtx = undefined;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.colorCanvas.width = this.width;
    this.colorCanvas.height = this.height;
    if (this.heatmap.options.debug) {
      this.opacityCanvas.width = this.width;
      this.opacityCanvas.height = this.height;
    }

    this.setup();
  }

  protected brushForItem(item: BaseShape) {
    const { shapeRegister, brushCache } = this.heatmap;

    const register = shapeRegister[item.type];
    const cacheKey = register.id(item);
    let brush = brushCache[item.type][cacheKey];
    if (!brush) {
      brush = register.brushFactory(item);
      brushCache[item.type][cacheKey] = brush;
    }
    return brush;
  }

  private buildPalette() {
    const {
      options: { paletteSize, defaultGradient },
    } = this.heatmap;
    const { paletteCanvas, paletteCtx } = this;
    paletteCanvas.width = paletteSize;
    paletteCanvas.height = 10;
    const gradient = paletteCtx.createLinearGradient(0, 0, paletteSize, 1);
    Object.entries(defaultGradient).forEach(([key, value]) => {
      gradient.addColorStop(parseFloat(key), value);
    });
    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, paletteSize, 1);

    const data = paletteCtx.getImageData(0, 0, paletteSize, 1).data;
    const paletteRgb = [];
    for (let i = 0; i < paletteSize; i += 1) {
      const offset = i * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      paletteRgb.push(r / 255, g / 255, b / 255);
    }

    return paletteRgb;
  }
}
