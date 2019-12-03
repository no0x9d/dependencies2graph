(function (window) {
  let panZoomInstance;
  const svgNS = "http://www.w3.org/2000/svg";

  function fetchSvg() {
    if (panZoomInstance) {
      panZoomInstance.destroy();
    }
    const formElement = document.querySelector('form');
    let formData = new FormData(formElement);
    const body = {};
    for (var [key, value] of formData) {
      body[key] = value;
    }
    window.fetch('/svg', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        "Content-Type": 'application/json'
      }
    })
      .then(res => res.text())
      .then(preprocessVizSVG)
      .then(svg => {
        document.querySelector('#svg').innerHTML = svg;
        const svgElement = document.querySelector('#svg svg');
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');

        panZoomInstance = svgPanZoom(svgElement, {
          zoomEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          // center: true,
          viewportSelector: '.svg-wrapper',
          maxZoom: 50
        });
      })
      .then(() => {
        forEachNode(svg, '.descendants', collapsed => {
          collapsed.classList.forEach(clazz => {
            const match = clazz.match(/descendant-count-(.*)/);
            if (match) {
              const folderSymbol = collapsed.querySelector('polyline');
              const bBox = folderSymbol.getBBox();
              const newText = document.createElementNS(svgNS, "text");
              newText.setAttributeNS(null, "x", bBox.x + 1);
              newText.setAttributeNS(null, "y", bBox.y + 6);
              newText.setAttributeNS(null, "font-size", "7px");
              newText.setAttributeNS(null, "text-anchor", "left");
              newText.setAttributeNS(null, "fill", "rgb(97,128,124)");
              const textNode = document.createTextNode(match[1]);
              newText.appendChild(textNode);
              collapsed.appendChild(newText);
              collapsed.setAttribute('data-count', match[1])
            }
          })
        });
      });
    return false;
  }

  function preprocessVizSVG(svgString) {
    const svg = stringToSvg(svgString);

    forEachNode(svg, '.edge', $edge => {
      let [from, to] = $edge.id.split(' -> ');
      $edge.setAttribute('data-from', from);
      $edge.setAttribute('data-to', to);
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  }

  function highlightHover() {
    let $prevHovered = null;

    let svgWrapper = document.getElementById('svg');

    function setHoveredClasses(elem, level) {
      if (level <= 1) {
        elem.classList.add('direct')
      }
      elem.classList.add('hovered');
    }

    function clearSelection() {
      if ($prevHovered) {
        removeClass(svgWrapper, '.hovered', 'hovered');
        removeClass(svgWrapper, '.hovered-dependency', 'hovered-dependency');
        removeClass(svgWrapper, '.hovered-dependent', 'hovered-dependent');
        removeClass(svgWrapper, '.direct', 'direct');
        $prevHovered = null;
      }
    }

    function markNodeDependents($node, level) {
      setHoveredClasses($node, level);
      if ($node.classList.contains('hovered-dependent')) {
        return;
      }
      $node.classList.add('hovered-dependent');
      edgesToNode($node.id).forEach(edge => {
        markEdgeDependent(edge, level + 1)
      });
    }

    function markEdgeDependent($edge, level) {
      setHoveredClasses($edge, level);
      const edgeSourceNode = edgeSource($edge);
      markNodeDependents(edgeSourceNode, level);
    }

    function markNodeDependencies($node, level) {
      setHoveredClasses($node, level);
      if ($node.classList.contains('hovered-dependency')) {
        return;
      }
      $node.classList.add('hovered-dependency');
      edgesFromNode($node.id).forEach(edge => {
        markEdgeDependencies(edge, level + 1)
      });
    }

    function markEdgeDependencies($edge, level) {
      setHoveredClasses($edge, level);
      const edgeTargetNode = edgeTarget($edge);
      markNodeDependencies(edgeTargetNode, level);
    }

    svgWrapper.addEventListener('mousemove', event => {
      const target = event.target;
      if ($prevHovered === target) {
        return;
      }

      if (isNode(target)) {
        const $node = getNode(target);
        if ($node.classList.contains('hovered')) {
          return;
        }
        clearSelection();
        $prevHovered = $node;
        markNodeDependents($node, 0);
        markNodeDependencies($node, 0);
      } else if (isEdge(target)) {
        const $edge = getEdge(target);
        if ($edge.classList.contains('hovered')) {
          return;
        }
        clearSelection();
        $prevHovered = $edge;
        markEdgeDependent($edge, 1);
        markEdgeDependencies($edge, 1)
      } else {
        clearSelection();
      }
    });
  }

  function forEachNode(parent, selector, fn) {
    let $nodes = parent.querySelectorAll(selector);
    for (let i = 0; i < $nodes.length; i++) {
      fn($nodes[i]);
    }
  }

  function removeClass(parent, selector, className) {
    forEachNode(parent, selector, node => node.classList.remove(className));
  }

  function stringToSvg(svgString) {
    var svgDoc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    return (document.importNode(svgDoc.documentElement, true));
  }

  function getParent(elem, className) {
    while (elem && elem.tagName !== 'svg') {
      if (elem.classList && elem.classList.contains(className)) {
        return elem;
      }
      elem = elem.parentNode;
    }
    return null;
  }

  function isNode(elem) {
    return getNode(elem) != null;
  }

  function getNode(elem) {
    return getParent(elem, 'node');
  }

  function isEdge(elem) {
    return getEdge(elem) != null;
  }

  function getEdge(elem) {
    return getParent(elem, 'edge');
  }

  function edgeSource(edge) {
    return document.getElementById(edge['dataset']['from']);
  }

  function edgeTarget(edge) {
    return document.getElementById(edge['dataset']['to']);
  }

  function edgesFromNode(id) {
    return document.querySelectorAll(".edge[data-from='" + id + "']");
  }

  function edgesToNode(id) {
    return document.querySelectorAll(".edge[data-to='" + id + "']");
  }

  function resizeHandler() {
    if (panZoomInstance) {
      panZoomInstance.resize();
    }
  }

  window.addEventListener('resize', resizeHandler);
  highlightHover();
  window.fetchSvg = fetchSvg;
})(window);
