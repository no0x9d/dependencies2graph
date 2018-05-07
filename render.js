module.exports = function render(data) {
  return renderGraph(
    renderNodes(data) + '\n' + renderEdges(data)
  );
};

function renderNodes(data) {
  return data
    .map((module) => {
        return module.path.slice(0, -1)
          .map((pathSegment, idx, arr) => ({source: arr.slice(0, idx + 1).join('/'), label: pathSegment}))
          .reduceRight((nestedGraph, node) => renderSubgraph(node.source, nestedGraph, {label: `"${node.label}"`}),
            renderNode(module.source, nodeStyles(module)))
      }
    ).join('\n')
}

function renderEdges(data) {
  return data
    .map((module) => {
        return module.dependencies
          .filter(dependency => dependency.source !== module.source || dependency.circular || !dependency.valid)
          .map(d => renderEdge(module.source, d.source, {color: determineEdgeColor(d)}))
          .join('\n')
      }
    ).join('\n')
}

function determineEdgeColor(dependency) {
  if (dependency.circular) {
    return 'orange';
  } else if(!dependency.valid) {
    return 'red';
  } else if(dependency.external) {
    return 'lightskyblue'
  }
  return 'black';
}

function renderSubgraph(id, content, attributes) {
  return `subgraph "cluster_${id}" { ${renderAttributes(attributes)} ${content} }`
}

function renderNode(id, attributes) {
  return `"${id}" [${renderAttributes(attributes)}]`
}

function renderAttributes(attributes) {
  if (!attributes || !Object.keys(attributes).length) {
    return '';
  }
  return Object.entries(attributes)
    .map(([key, value]) => renderAttribute(key, value))
    .join(' ')
}

function renderAttribute(key, value) {
  return `${key}=${value}`;
}

function renderEdge(from, to, attributes) {
  return `  "${from}" -> "${to}" [${renderAttributes(attributes)}]`;
}

function nodeStyles(module) {
  const attributes = {label: `"${module.path.pop()}"`};

  if(module.isModule) {
    attributes.fillcolor = '"#ffffff"';
    attributes.height = "0.4";
    attributes.shape = 'tab';
  }

  if(module.external) {
    attributes.fillcolor = 'lightskyblue'
  }

  return attributes
}

function renderGraph(graph) {
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
