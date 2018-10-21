import groupBy = require("lodash.groupby");

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
  externalDependencies: boolean,
  externalDepth: number
}

export function transform(data: DependencyCruiserOutputFormatV3 | DependencyCruiserOutputFormatV4, options: Options): Module[] {
  const {depth, path, externalDependencies, externalDepth} = options;
  const pathMatcher = new RegExp(path);
  const dependencyPredicate = externalDependencies ? () => true : (dep: Dependency) => pathMatcher.test(dep.resolved);
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
      const groupedBySourceDependencies: { [key: string]: any[] } = groupBy(module.dependencies, (dep: ModuleDependency ) => dep.source);
      module.dependencies = Object.values(groupedBySourceDependencies)
        .map((depArray: ModuleDependency[]) => depArray.reduce((acc, curr) => Object.assign({}, acc, curr, preserveState(acc, curr)),
          {valid: true} as ModuleDependency));
      deps.push(module);
    }
    rootModules = deps;
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

function shouldTruncate(module: {path: string[]}, depth: number): boolean {
  return module.path.length > depth;
}

function preserveState(dep1: ModuleDependency, dep2: ModuleDependency):
  { circular: boolean | undefined, valid: boolean } {
  return {
    circular: dep1.circular || dep2.circular,
    valid: dep1.valid && dep2.valid
  }
}

function truncatePath(module: {path: string[], external: boolean}, depth: number, externalDepth: number):
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
