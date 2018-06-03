import * as groupBy from 'lodash.groupby';
import {DependencyCruiserOutputFormatV3, DependencyCruiserOutputFormatV4} from './typings/dependency-cruiser';

const pathSep = '/';

interface Dependency {
  source: string;
  path: string[];
  external: boolean;
  dependencies: any[];
}

export function transform(data: DependencyCruiserOutputFormatV3 | DependencyCruiserOutputFormatV4, options) {
  const {depth, path, externalDependencies, externalDepth} = options;
  const pathMatcher = new RegExp(path);
  const dependencyPredicate = externalDependencies ? () => true : dep => pathMatcher.test(dep.resolved);
  let externalModules: Dependency[] = [];
  let cruisedModules = ((<DependencyCruiserOutputFormatV3>data).dependencies ||
    (<DependencyCruiserOutputFormatV4>data).modules );
  let rootModules = cruisedModules
    .filter(module => pathMatcher.test(module.source))
    .map(module => {
      const dependencies = module.dependencies
        .filter(dependencyPredicate)
        .map(dep => ({
          source: dep.resolved,
          path: dep.resolved.split(pathSep),
          external: !pathMatcher.test(dep.resolved),
          valid: dep.valid,
          circular: dep.circular
        }));

      dependencies
        .filter(dep => dep.external)
        .forEach(dep => externalModules.push({source: dep.source, path: dep.path, external: true, dependencies: []}));

      return {
        source: module.source,
        path: module.source.split(pathSep),
        dependencies
      }
    });

  rootModules.push(...externalModules);

  if (depth > 0) {
    const rootModulesMap = rootModules
      .map(module => {
        module = Object.assign({}, module, truncatePath(module, depth, externalDepth));

        module.dependencies =
          module.dependencies.map(dep => Object.assign({}, dep, truncatePath(dep, depth, externalDepth)));

        return module;
      }).reduce(groupBySource, new Map());

    const deps: any[] = [];
    for (const [source, module] of rootModulesMap) {
      const groupedBySourceDependencies: {[key: string]: any[]} = groupBy(module.dependencies, (dep) => dep.source);
      module.dependencies = Object.values(groupedBySourceDependencies)
        .map(depArray => depArray.reduce((acc, curr) => Object.assign({}, acc, curr, preserveState(acc, curr)),
          {valid: true}));
      deps.push(module);
    }
    rootModules = deps;
  }
  return rootModules;
};

function groupBySource(map, module) {
  if (map.has(module.source)) {
    map.get(module.source)
      .dependencies
      .push(...module.dependencies);
  } else {
    map.set(module.source, module)
  }
  return map;
}

function shouldTruncate(module, depth) {
  return module.path.length > depth;
}

function preserveState(dep1, dep2) {
  return {
    circular: dep1.circular || dep2.circular,
    valid: dep1.valid && dep2.valid
  }
}

function truncatePath(module, depth, externalDepth) {
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
