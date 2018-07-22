import * as fs from 'fs';
//@ts-ignore TS2306
import * as Viz from 'viz.js';

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
    write(outputTo, Viz(dotGraph, {engine, format}));
  }
};
