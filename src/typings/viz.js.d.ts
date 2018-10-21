type DotGraph = string;

interface RenderOptions {
  engine?: 'dot' | 'circo' | 'fdp' | 'neato' | 'osage' | 'twopi';
  format?: "svg" | "dot" | "xdot" | "plain" | "plain-ext" | "ps" | "ps2" | "json" | "json0";
  yInvert?: boolean;
  images?: { path: string, width: number | string, height: number | string }[];
  files?: { path: string, data: string }[];
}

interface VizOptions {
  Module?: Function;
  render?: Function;
  workerURL?: string;
  worker?: any;
}

declare class Viz {
  constructor(options: VizOptions)

  renderString(src: DotGraph, options?: RenderOptions): Promise<string>

  renderSVGElement(src: DotGraph, options?: RenderOptions): Promise<any>

  renderImageElement(src: DotGraph, options?: RenderOptions): Promise<any>

  renderJSONObject(src: DotGraph, options?: RenderOptions): Promise<Object>
}

declare module 'viz.js' {
  export = Viz
}

declare module 'viz.js/full.render' {
  export const Module: Function;
  export const render: Function
}
