import * as express from 'express';
import * as bodyParser from 'body-parser';
import {transform} from '../transform';
import {render} from '../render';
import {Module, render as VizRender} from 'viz.js/full.render'
import {DependencyCruiserOutputFormatV3, DependencyCruiserOutputFormatV4} from '../typings/dependency-cruiser';
import {readData} from './util';
import Viz = require('viz.js');

const PORT = 3000;
const engine = 'dot';
const format = 'svg';

export function runServer(data: DependencyCruiserOutputFormatV3 | DependencyCruiserOutputFormatV4) {
  // READ
  const app = express();
  app.use(express.static(__dirname + '/../../static'));
  app.use(bodyParser.json());

  app.get('/metadata', (req, res) => res.send(data));

  app.post('/svg', (req, res) => {
    const options = {
      depth: 1,
      path: '',
      externalFilter: undefined,
      externalDependencies: false,
      externalDependents: false,
      externalDepth: 1,
      markConnectedComponents: false
    };
    Object.assign(options, req.body);
    const dependencies = transform(data, options);
    const dotGraph = render(dependencies);
    const viz = new Viz(
      {Module, render: VizRender});
    viz.renderString(dotGraph, {engine, format})
      .then((outputSvg: string) => {
        res.type('text/svg+xml');
        res.send(outputSvg);
      });

  });

  const port = process.env.PORT || PORT;
  app.listen(port);
  console.log(`Server runs on http://localhost:${port}`);
}

// run server if file is directly executed via `node server`
if (module && !module.parent) {
  const filename = process.argv[2];
  readData(filename)
    .then(runServer)
}
