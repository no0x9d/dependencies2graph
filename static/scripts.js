(function (window) {
  let panZoomInstance;

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

    function clearSelection() {
      if ($prevHovered) {
        removeClass(svgWrapper, '.hovered', 'hovered');
        $prevHovered = null;
      }
    }

    function markNodeDependents($node) {
      if ($node.classList.contains('hovered')) {
        return;
      }
      $node.classList.add('hovered');
      edgesToNode($node.id).forEach(edge => {
        markEdgeDependent(edge)
      });
    }

    function markEdgeDependent($edge) {
      $edge.classList.add('hovered');
      const edgeSourceNode = edgeSource($edge);
      markNodeDependents(edgeSourceNode);
    }

    function markNodeDependencies($node, force) {
      if ($node.classList.contains('hovered') && !force) {
        return;
      }
      $node.classList.add('hovered');
      edgesFromNode($node.id).forEach(edge => {
        markEdgeDependencies(edge)
      });
    }

    function markEdgeDependencies($edge) {
      $edge.classList.add('hovered');
      const edgeTargetNode = edgeTarget($edge);
      markNodeDependencies(edgeTargetNode);
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
        markNodeDependents($node);
        markNodeDependencies($node, true);
      } else if (isEdge(target)) {
        const $edge = getEdge(target);
        if ($edge.classList.contains('hovered')) {
          return;
        }
        clearSelection();
        $prevHovered = $edge;
        markEdgeDependent($edge);
        markEdgeDependencies($edge)
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
      if (elem.classList.contains(className)) {
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

  highlightHover();
  window.fetchSvg = fetchSvg;
})(window);
