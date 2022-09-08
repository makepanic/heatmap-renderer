import { BaseShape } from "./shape";
import { Brush } from "./brushes";
import { Renderer } from "./renderer/renderer";
import { GlRenderer } from "./renderer/gl/gl-renderer";

const defaultOptions: HeatmapOptions = {
  min: 0,
  max: 10,
  debug: false,
  dither: true,
  paletteSize: 64,
  defaultGradient: {
    0.25: "rgb(0,0,255)",
    0.55: "rgb(0,255,0)",
    0.85: "yellow",
    1.0: "rgb(255,0,0)",
  },
};

export interface ShapeRegister<T extends BaseShape> {
  type: number;
  id: (item: T) => string;
  brushFactory: (item: T) => Brush;
}

export interface HeatmapOptions {
  min: number;
  max: number;
  debug: boolean;
  dither: boolean;
  paletteSize: number;
  defaultGradient: Record<number, string>;
}

export class Heatmap {
  public options: HeatmapOptions;

  private renderer: Renderer;
  private renderList: BaseShape[] = [];

  public shapeRegister: Record<number, ShapeRegister<any>> = {};
  public brushCache: Record<number, Record<string, Brush>> = {};

  get width() {
    return this.renderer.width;
  }
  get height() {
    return this.renderer.height;
  }

  constructor(
    private container: HTMLElement,
    options: Partial<HeatmapOptions> = {}
  ) {
    this.options = { ...defaultOptions, ...options };
    this.renderer = new GlRenderer(container, this);
    this.renderer.setup();
  }

  registerShape<T extends BaseShape>(register: ShapeRegister<T>) {
    this.brushCache[register.type] = {};
    this.shapeRegister[register.type] = register;
  }

  public redraw() {
    this.render(this.renderList);
  }

  public render(renderList: BaseShape[]) {
    this.renderList = renderList;
    this.renderer.render(renderList);
  }

  public resize(width: number, height: number) {
    this.renderer.resize(width, height);
  }

  public destroy() {
    this.renderer.destroy();
    this.brushCache = {};
  }
}
