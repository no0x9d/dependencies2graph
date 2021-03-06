/**
 * How severe a violation of a rule is. The 'error' severity will make some reporters return a non-zero exit code, so if you want e.g. a build to stop when there's a rule violated: use that.
 */
export type SeverityType = ("error" | "warn" | "info");
export type ModuleSystemType = ("cjs" | "amd" | "es6" | "tsd");
export type OutputType = ("html" | "dot" | "err" | "json");
export type DependencyType = ("local" | "npm" | "npm-dev" | "npm-optional" | "npm-peer" | "npm-bundled" | "npm-no-pkg" | "npm-unknown" | "core" | "unknown" | "undetermined" | "deprecated");

interface DependencyCruiserOutputFormat {
  /**
   * Data summarizing the found dependencies
   */
  summary: {
    /**
     * A list of violations found in the dependencies. The dependencies themselves also contain this information, this summary is here for convenience.
     */
    violations: ViolationType[];
    /**
     * the number of errors in the dependencies
     */
    error: number;
    /**
     * the number of warnings in the dependencies
     */
    warn: number;
    /**
     * the number of informational level notices in the dependencies
     */
    info: number;
    /**
     * the number of modules cruised
     */
    totalCruised: number;
    optionsUsed: OptionsType;
  };
}

export interface DependencyCruiserOutputFormatV4 extends DependencyCruiserOutputFormat{
  /**
   * A list of modules, with for each module the modules it depends upon
   */
  modules: CruisedModules[];
}
export interface DependencyCruiserOutputFormatV3 extends DependencyCruiserOutputFormat{
  /**
   * A list of modules, with for each module the modules it depends upon
   */
  dependencies: CruisedModules[];
}

export interface CruisedModules {
  /**
   * The (resolved) file name of the module, e.g. 'src/main/index.js'
   */
  source: string;
  /**
   * Whether or not this is a dependency that can be followed any further. This will be 'false' for for core modules, json, modules that could not be resolved to a file and modules that weren't followed because it matches the doNotFollow expression.
   */
  followable?: boolean;
  /**
   * 'true' if the file name of this module matches the doNotFollow regular expression
   */
  matchesDoNotFollow?: boolean;
  /**
   * Whether or not this is a node.js core module
   */
  coreModule?: boolean;
  /**
   * 'true' if dependency-cruiser could not resolve the module name in the source code to a file name or core module. 'false' in all other cases.
   */
  couldNotResolve?: boolean;
  /**
   * the type of inclusion - local, core, unknown (= we honestly don't know), undetermined (= we didn't bother determining it) or one of the npm dependencies defined in a package.jsom ('npm' for 'depenencies', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-no-pkg' for development, optional, peer dependencies and dependencies in node_modules but not in package.json respectively)
   */
  dependencyTypes?: DependencyType[];
  /**
   * the license, if known (usually known for modules pulled from npm, not for local ones)
   */
  license?: string;
  /**
   * 'true' if this dependency does not have dependencies, and no module has it as a dependency
   */
  orphan?: boolean;
  /**
   * 'true' if this module violated a rule; 'false' in all other cases. The violated rule will be in the 'rule' object at the same level.
   */
  valid: boolean;
  /**
   * an array of rules violated by this module - left out if the module is valid
   */
  rules?: RuleSummaryType[];
  dependencies: Dependency[];
}
export interface Dependency {
  /**
   * The name of the module as it appeared in the source code, e.g. './main'
   */
  module: string;
  /**
   * The (resolved) file name of the module, e.g. 'src/main//index.js'
   */
  resolved: string;
  /**
   * Whether or not this is a node.js core module - deprecated in favor of dependencyType === core
   */
  coreModule: boolean;
  /**
   * the type of inclusion - local, core, unknown (= we honestly don't know), undetermined (= we didn't bother determining it) or one of the npm dependencies defined in a package.jsom ('npm' for 'depenencies', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-no-pkg' for development, optional, peer dependencies and dependencies in node_modules but not in package.json respectively)
   */
  dependencyTypes: DependencyType[];
  /**
   * the license, if known (usually known for modules pulled from npm, not for local ones)
   */
  license?: string;
  /**
   * Whether or not this is a dependency that can be followed any further. This will be 'false' for for core modules, json, modules that could not be resolved to a file and modules that weren't followed because it matches the doNotFollow expression.
   */
  followable: boolean;
  /**
   * 'true' if the file name of this module matches the doNotFollow regular expression
   */
  matchesDoNotFollow?: boolean;
  /**
   * 'true' if dependency-cruiser could not resulve the module name in the source code to a file name or core module. 'false' in all other cases.
   */
  couldNotResolve: boolean;
  /**
   * 'true' if following this dependency will ultimately return to the source, false in all other cases
   */
  circular?: boolean;
  moduleSystem: ModuleSystemType;
  /**
   * 'true' if this dependency violated a rule; 'false' in all other cases. The violated rule will be in the 'rule' object at the same level.
   */
  valid: boolean;
  /**
   * an array of rules violated by this dependency - left out if the dependency is valid
   */
  rules?: RuleSummaryType[];
}
export interface ViolationType {
  from: string;
  to: string;
  rule: RuleSummaryType;
}
/**
 * If there was a rule violation (valid === false), this object contains the name of the rule and severity of violating it.
 */
export interface RuleSummaryType {
  /**
   * The (short, eslint style) name of the violated rule. Typically something like 'no-core-punycode' or 'no-outside-deps'.
   */
  name: string;
  severity: SeverityType;
}
/**
 * the (command line) options used to generate the dependency-tree
 */
export interface OptionsType {
  /**
   * The rules file used to validate the dependencies (if any)
   */
  rulesFile?: string;
  /**
   * File the output was written to ('-' for stdout)
   */
  outputTo?: string;
  /**
   * The regular expression used for preventing modules from being cruised any further
   */
  doNotFollow?: string;
  /**
   * The regular expression used for excluding modules from being cruised
   */
  exclude?: string;
  /**
   * The maximum cruise depth specified. 0 means no maximum specified
   */
  maxDepth?: number;
  moduleSystems?: ModuleSystemType[];
  outputType?: OutputType;
  prefix?: string;
  tsPreCompilationDeps?: boolean;
  preserveSymlinks?: boolean;
}
