import groupBy = require("lodash.groupby");
import * as graphlib from '@dagrejs/graphlib';

import {
  CruisedModules, Dependency,
  DependencyCruiserOutputFormatV3,
  DependencyCruiserOutputFormatV4
} from './typings/dependency-cruiser';

const pathSep = '/';

export interface Module {
  source: string;
  path: string[];
  external: boolean;
  dependencies: ModuleDependency[];
  isModule?: boolean;
}

export interface ModuleDependency {
  source: string;
  path: string[];
  external: boolean;
  circular?: boolean;
  valid: boolean;
}

interface Options {
  depth: number,
  path: string,
  externalFilter?: string,
  externalDependencies: boolean,
  externalDependents: boolean,
  externalDepth: number
  markConnectedComponents: boolean;
}

export function transform(data: DependencyCruiserOutputFormatV3 | DependencyCruiserOutputFormatV4,
  options: Options): Module[] {
  const {depth, path, externalFilter, externalDependencies, externalDependents, externalDepth, markConnectedComponents} = options;
  const pathMatcher = new RegExp(path);
  const dependencyPredicate = externalDependencies ?
    (dep: Dependency) => externalFilter ? dep.resolved.match(externalFilter) : true :
    (dep: Dependency) => pathMatcher.test(dep.resolved);
  let externalModules: Module[] = [];
  let cruisedModules: CruisedModules[] = ((<DependencyCruiserOutputFormatV3>data).dependencies ||
    (<DependencyCruiserOutputFormatV4>data).modules);
  let rootModules: Module[] = cruisedModules
    .filter((module: CruisedModules) => pathMatcher.test(module.source))
    .map((module: CruisedModules) => {
      const dependencies: ModuleDependency[] = module.dependencies
        .filter(dependencyPredicate)
        .map((dep: Dependency) => ({
          source: dep.resolved,
          path: dep.resolved.split(pathSep),
          external: !pathMatcher.test(dep.resolved),
          valid: dep.valid,
          circular: dep.circular,
        }));

      dependencies
        .filter(dep => dep.external)
        .forEach(dep => externalModules.push({source: dep.source, path: dep.path, external: true, dependencies: []}));

      return {
        source: module.source,
        path: module.source.split(pathSep),
        external: false,
        dependencies
      }
    });

  rootModules.push(...externalModules);

  // ==== add dependents ====

  if (externalDependents) {
    const dependantModules = cruisedModules
      .filter(cruisedModule => !pathMatcher.test(cruisedModule.source) &&
        (!externalFilter || cruisedModule.source.match(externalFilter)) &&
        cruisedModule.dependencies.some(dep => pathMatcher.test(dep.resolved))
      )
      .map(cruisedModule => {

        const dependencies: ModuleDependency[] = cruisedModule.dependencies
          .filter(dep => pathMatcher.test(dep.resolved))
          .map((dep: Dependency) => ({
            source: dep.resolved,
            path: dep.resolved.split(pathSep),
            external: false,
            valid: dep.valid,
            circular: dep.circular,
          }));

        return {
          source: cruisedModule.source,
          path: cruisedModule.source.split(pathSep),
          external: true,
          dependencies
        }
      });

    rootModules.push(...dependantModules);
  }
  // ===============

  if (depth > 0) {
    const rootModulesMap: Map<string, Module> = rootModules
      .map((module: Module) => {
        module = Object.assign({}, module, truncatePath(module, depth, externalDepth));

        module.dependencies =
          module.dependencies.map(dep => Object.assign({}, dep, truncatePath(dep, depth, externalDepth)));

        return module;
      }).reduce(groupBySource, new Map<string, Module>());

    const deps: Module[] = [];
    for (const [_source, module] of rootModulesMap) {
      const groupedBySourceDependencies: { [key: string]: any[] } = groupBy(module.dependencies,
        (dep: ModuleDependency) => dep.source);
      module.dependencies = Object.values(groupedBySourceDependencies)
        .map((depArray: ModuleDependency[]) => depArray.reduce(
          (acc, curr) => Object.assign({}, acc, curr, preserveState(acc, curr)),
          {valid: true} as ModuleDependency));
      deps.push(module);
    }
    rootModules = deps;
  }

  if (markConnectedComponents) {
    findAndMarkConnectedComponents(rootModules);
  }

  return rootModules;
}

function groupBySource(map: Map<string, Module>, module: Module) {
  if (map.has(module.source)) {
    map.get(module.source)!
      .dependencies
      .push(...module.dependencies);
  } else {
    map.set(module.source, module)
  }
  return map;
}

function shouldTruncate(module: { path: string[] }, depth: number): boolean {
  return module.path.length > depth;
}

function preserveState(dep1: ModuleDependency, dep2: ModuleDependency):
  { circular: boolean | undefined, valid: boolean } {
  return {
    circular: dep1.circular || dep2.circular,
    valid: dep1.valid && dep2.valid
  }
}

function truncatePath(module: { path: string[], external: boolean }, depth: number, externalDepth: number):
  { source?: string, path?: string[], isModule?: boolean } {
  depth = module.external ? externalDepth : depth;
  if (shouldTruncate(module, depth)) {
    const sp = module.path.slice(0, depth);
    return {
      source: sp.join(pathSep),
      path: sp,
      isModule: true
    }
  } else {
    return {};
  }
}

function findAndMarkConnectedComponents(rootModules: Module[]) {
  const graph = new graphlib.Graph({directed: true, multigraph: false});

  // set nodes
  rootModules.forEach(module => {
    graph.setNode(module.source, module);
  });

  // set edges
  rootModules.forEach(module => {
    module.dependencies.forEach(dependency => {
      graph.setEdge(module.source, dependency.source);
    })
  });

  let connectedComponents = graphlib.alg.tarjan(graph)
    .filter(component => component.length > 1);

  // mark connected components
  connectedComponents.forEach(component => {
    component.forEach(node => {
      const module: Module = graph.node(node);
      module.dependencies
        .filter(dep => component.indexOf(dep.source) > -1 && dep.source !== module.source)
        .forEach(dep => dep.circular = true);
    });
  });

  if (connectedComponents.length > 0) {
    console.log('mark the following connected dependencies as circular:');
    connectedComponents.forEach((component, index) => console.log(`${index + 1}: ${component.join(', ')}`))
  }
}
