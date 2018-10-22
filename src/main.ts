import * as fs from 'fs';
import Viz = require('viz.js');
import {Module, render as VizRender} from 'viz.js/full.render'

import {transform} from './transform';
import {render} from './render';
import {write} from './write';

export interface Options {
  depth: number;
  path: string;
  externalDependencies: boolean;
  externalDepth: number;
  outputTo: string;
  format: 'svg' | 'dot' | 'raw';
  engine: 'dot' | 'circo' | 'fdp' | 'neato' | 'osage' | 'twopi';
  filename: string,
  markConnectedComponents: boolean;
}

export function run(options: Options) {
  const {path, depth, externalDependencies, externalDepth, outputTo, format, engine, filename, markConnectedComponents} = options;
  // READ
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  // TRANSFORM
  const dependencies = transform(data, {path, depth, externalDependencies, externalDepth, markConnectedComponents});
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
