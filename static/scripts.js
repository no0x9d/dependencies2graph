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

  window.fetchSvg = fetchSvg;
})(window);
