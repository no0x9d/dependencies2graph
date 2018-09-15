import * as fs from 'fs';
import * as Viz from 'viz.js';
import {Module, render as VizRender} from 'viz.js/full.render'

import {transform} from './transform';
import {render} from './render';
import {write} from './write';

export function run({path, depth, externalDependencies, externalDepth, outputTo, format, engine, filename}) {
  // READ
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  // TRANSFORM
  const dependencies = transform(data, {path, depth, externalDependencies, externalDepth});
  // WRITE
  const dotGraph = render(dependencies);
  if (format === 'dot') {
    write(outputTo, dotGraph);
  } else if (format === 'raw') {
    write(outputTo, JSON.stringify(dependencies, null, 2));
  } else {
    const viz = new Viz({Module, render: VizRender});
    viz.renderString(dotGraph, {engine, format, totalMemory: 256})
      .then(output => {
        write(outputTo, output);
      });
  }
};
