import Viz = require('viz.js');
import {Module, render as VizRender} from 'viz.js/full.render'

import {transform} from './transform';
import {render} from './render';
import {write} from './write';
import {DependencyCruiserOutputFormatV3, DependencyCruiserOutputFormatV4} from './typings/dependency-cruiser';

export interface Options {
  depth: number;
  path: string;
  externalFilter?: string
  externalDependencies: boolean;
  externalDependents: boolean;
  externalDepth: number;
  outputTo: string;
  format: 'svg' | 'dot' | 'raw';
  engine: 'dot' | 'circo' | 'fdp' | 'neato' | 'osage' | 'twopi';
  data: DependencyCruiserOutputFormatV3 | DependencyCruiserOutputFormatV4,
  markConnectedComponents: boolean;
}

export function run(options: Options) {
  const {path, depth, externalFilter, externalDependencies, externalDependents, externalDepth, outputTo, format, engine, data, markConnectedComponents} = options;
  // READ
  // TRANSFORM
  const dependencies = transform(data, {path, depth, externalFilter, externalDependencies, externalDependents, externalDepth, markConnectedComponents});
  // WRITE
  const dotGraph = render(dependencies);
  if (format === 'dot') {
    write(outputTo, dotGraph);
  } else if (format === 'raw') {
    write(outputTo, JSON.stringify(dependencies, null, 2));
  } else {
    const viz = new Viz(
      {Module, render: VizRender});
    viz.renderString(dotGraph, {engine, format})
      .then((output: string) => {
        write(outputTo, output);
      });
  }
}
