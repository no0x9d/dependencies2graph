import {Module, ModuleDependency} from './transform';

export function render(data: Module[]) {
  return renderGraph(
    renderNodes(data) + '\n' + renderEdges(data)
  );
}

function renderNodes(data: Module[]) {
  return data
    .map((module: Module) => {
        return module.path.slice(0, -1)
          .map((pathSegment: string, idx: number, arr: string[]) => ({
            source: arr.slice(0, idx + 1).join('/'),
            label: pathSegment
          }))
          .reduceRight((nestedGraph, node) => renderSubgraph(node.source, nestedGraph, {label: `"${node.label}"`}),
            renderNode(module.source, nodeStyles(module)))
      }
    ).join('\n')
}

function renderEdges(data: Module[]) {
  return data
    .map((module: Module) => {
        return module.dependencies
          .filter(dependency => dependency.source !== module.source || dependency.circular || !dependency.valid)
          .map(d => renderEdge(module.source, d.source, {color: determineEdgeColor(d)}))
          .join('\n')
      }
    ).join('\n')
}

function determineEdgeColor(dependency: ModuleDependency) {
  if (dependency.circular) {
    return 'orange';
  } else if (!dependency.valid) {
    return 'red';
  } else if (dependency.external) {
    return 'lightskyblue'
  }
  return 'black';
}

function renderSubgraph(id, content, attributes: Attributes) {
  return `subgraph "cluster_${id}" { ${renderAttributes(attributes)} ${content} }`
}

function renderNode(id: string, attributes: Attributes) {
  return `"${id}" [${renderAttributes(attributes)}]`
}

function renderAttributes(attributes: Attributes): string {
  if (!attributes || !Object.keys(attributes).length) {
    return '';
  }
  return Object.keys(attributes)
    .map(key => [key, attributes[key]])
    .map(([key, value]) => renderAttribute(key, value))
    .join(' ')
}

function renderAttribute(key: string, value: string): string {
  return `${key}=${value}`;
}

function renderEdge(from: string, to: string, attributes): string {
  return `  "${from}" -> "${to}" [${renderAttributes(attributes)}]`;
}

function nodeStyles(module: Module): Attributes {
  const attributes: Attributes = {label: `"${module.path.pop()}"`};

  if (module.isModule) {
    attributes.fillcolor = '"#ffffff"';
    attributes.height = "0.4";
    attributes.shape = 'tab';
  }

  if (module.external) {
    attributes.fillcolor = 'lightskyblue'
  }

  return attributes
}

function renderGraph(graph: string) {
  return `digraph G {
    rankdir=TB
    splines=true
    overlap=false
    nodesep=0.16
    fontname="Helvetica-bold"
    fontsize=9
    style="rounded,bold"
    compound=true
    node [shape=box style="rounded, filled" fillcolor="#ffffcc" height=0.2 fontname=Helvetica fontsize=9]
    edge [color=black arrowhead=normal fontname=Helvetica fontsize=9]
    
    ${graph}
    }`;
}

interface Attributes {
  [key: string]: string;
}
