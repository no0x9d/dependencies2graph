#!/usr/bin/env node
import * as yargs from 'yargs';
import {run} from '../main';

const argv = yargs
  .option('i', {
    alias: 'input',
    description: 'dependency-cruiser JSON file',
    demandOption: true,
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
  .option('E', {
    alias: 'engine',
    description: 'Graphviz engine (responsible for graph layout)',
    choices: ['dot', 'circo', 'fdp', 'neato', 'osage', 'twopi'],
    default: 'dot',
    type: 'string',
    requiresArg: true
  }).argv;

const pathSep = '/';

const filename = argv.input;
const path = argv.filter;
const depth = argv.depth ? path.split(pathSep).length + argv.depth : 0;
const externalDependencies = argv.externalDependencies;
const externalDepth = argv.externalDepth;
const outputTo = argv.out;
const engine = argv.engine;
const format = argv.target;
const markConnectedComponents = argv.connectedComponents

run({filename, path, depth, externalDependencies, externalDepth, outputTo, engine, format, markConnectedComponents});
