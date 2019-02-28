#!/usr/bin/env node
import * as yargs from 'yargs';
import {Arguments, Argv} from 'yargs';
import {run} from '../main';
import {runServer} from './server';
import {readData} from './util';

const argv = yargs
  .help()
  .scriptName('')
  .command(['viewer [deps]', '$0'], 'starts a web-server with an interactive graph viewer',
    (yargs: Argv) => {
      return yargs.positional('deps', {
        description: 'path to dependency json file, if omitted read from stdin',
        type: 'string'
      })
    },
    ((args: Arguments) => readData(args.deps)
        .then(data => {
          runServer(data)
        })
    )
  )
  .command('generate', 'generates a dependency graph',
    (yargs: Argv) =>
      yargs
        .option('i', {
          alias: 'input',
          description: 'dependency-cruiser JSON file, if omitted read from stdin',
          type: 'string',
          requiresArg: true
        })
        .option('f', {
          alias: 'filter',
          description: 'path for the dependency subgraph',
          default: '',
          type: 'string',
          requiresArg: true
        })
        .option('d', {
          alias: 'depth',
          description: 'number of child folders to show(0 for infinite)',
          default: 1,
          type: 'number',
          requiresArg: true
        })
        .option('D', {
          alias: 'external-depth',
          description: 'number of child folders for external dependencies',
          default: 1,
          type: 'number',
          requiresArg: true
        })
        .option('e', {
          alias: 'external-dependencies',
          description: 'flag to show dependencies which point outside of <filter>',
          default: false,
          type: 'boolean',
        })
        .option('F', {
          alias: 'external-filter',
          description: 'filter path for external dependencies and dependents',
          type: 'string',
        })
        .option('E', {
          alias: 'external-dependents',
          description: 'flag to show dependents which point inside of <filter>',
          default: false,
          type: 'boolean',
        })
        .option('C', {
          alias: 'connected-components',
          description: 'mark all connected components of the dependency tree as circular',
          default: false,
          type: 'boolean'
        })
        .option('o', {
          alias: 'out',
          description: 'output file',
          default: '-',
          defaultDescription: 'stdout',
          type: 'string',
          requiresArg: true
        })
        .option('t', {
          alias: 'target',
          description: 'output format',
          choices: ['svg', 'dot', 'raw'],
          default: 'svg',
          type: 'string',
          requiresArg: true
        })
        .option('engine', {
          description: 'Graphviz engine (responsible for graph layout)',
          choices: ['dot', 'circo', 'fdp', 'neato', 'osage', 'twopi'],
          default: 'dot',
          type: 'string',
          requiresArg: true
        })
    , (argv: Arguments) => {
      const filename = argv.input;
      const path = argv.filter;
      const depth = argv.depth >= 0 ? argv.depth : 1;
      const externalFilter = argv.externalFilter;
      const externalDependencies = argv.externalDependencies;
      const externalDependents = argv.externalDependents;
      const externalDepth = argv.externalDepth >= 0 ? argv.externalDepth : 1;
      const outputTo = argv.out;
      const engine = argv.engine;
      const format = argv.target;
      const markConnectedComponents = argv.connectedComponents;

      readData(filename)
        .then(data => {
          run({
            data,
            path,
            depth,
            externalDependencies,
            externalFilter,
            externalDependents,
            externalDepth,
            outputTo,
            engine,
            format,
            markConnectedComponents
          });
        })
    }
  )
  .argv;

