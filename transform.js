const groupBy = require('lodash.groupby');

const pathSep = '/';

module.exports = function transform(data, options) {
  const {depth, path, externalDependencies, externalDepth} = options;
  const pathMatcher = new RegExp(path);
  const dependencyPredicate = externalDependencies ? () => true : dep => pathMatcher.test(dep.resolved);
  let externalModules = [];
  let rootModules = (data.dependencies /*dependency-cruiser <= v3.x.x*/|| data.modules /* dependency-cruisier >= v4.0.0*/)
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

    deps = [];
    for ([source, module] of rootModulesMap) {
      const groupedBySourceDependencies = groupBy(module.dependencies, (dep) => dep.source);
      module.dependencies = Object.values(groupedBySourceDependencies)
        .map(depArray => depArray.reduce((acc, curr) => Object.assign({}, acc, curr, preserveState(acc, curr)), {valid: true}));
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
  } else
    return {};
}
