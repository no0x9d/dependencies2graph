const fs = require('fs');
const Viz = require('viz.js');

const transform = require('./transform');
const dotRender = require('./render');
const write = require('./write');

module.exports = function run({path, depth, externalDependencies, externalDepth, outputTo, format, engine, filename}) {
  // READ
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  // TRANSFORM
  const dependencies = transform(data, {path, depth, externalDependencies, externalDepth});
  // WRITE
  const dotGraph = dotRender(dependencies);
  if (format === 'dot') {
    write(outputTo, dotGraph);
  } else if (format === 'raw') {
    write(outputTo, JSON.stringify(dependencies, null, 2));
  } else {
    write(outputTo, Viz(dotGraph, {engine, format}));
  }
};
