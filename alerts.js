(function(){
  const LAT = 51.318, LON = -2.208;

  async function loadAlerts(){
    const listEl = document.getElementById('alerts-list');
    listEl.innerHTML = '';
    if (!window.NSWWS || !NSWWS.API_KEY || !NSWWS.ATOM_FEED_URL){
      const p = document.createElement('p');
      p.className = 'muted';
      p.innerHTML = `No API key configured. <a href="https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings" target="_blank" rel="noopener">Check current warnings on metoffice.gov.uk</a>.`;
      listEl.appendChild(p);
      return;
    }
    try{
      // 1) Get Atom feed (auth header)
      const atomResp = await fetch(NSWWS.ATOM_FEED_URL, { headers: { 'x-api-key': NSWWS.API_KEY, 'Accept': 'application/atom+xml' }});
      if (!atomResp.ok) throw new Error('Feed fetch failed');
      const atomText = await atomResp.text();

      // 2) Parse Atom to find the "related" GeoJSON link (latest issued warnings)
      const parser = new DOMParser();
      const xml = parser.parseFromString(atomText, 'application/xml');
      const link = Array.from(xml.getElementsByTagName('link')).find(l => l.getAttribute('rel')==='related');
      if (!link) throw new Error('No related GeoJSON link in feed');
      const geojsonUrl = link.getAttribute('href');

      // 3) Get GeoJSON of warnings
      const gjResp = await fetch(geojsonUrl, { headers: { 'x-api-key': NSWWS.API_KEY, 'Accept': 'application/geo+json' }});
      if (!gjResp.ok) throw new Error('GeoJSON fetch failed');
      const gj = await gjResp.json();

      // 4) Filter features that intersect BA14 (point-in-polygon)
      const hits = (gj.features || []).filter(f => intersectsPoint(f.geometry, [LON, LAT]));

      if (hits.length === 0){
        listEl.innerHTML = '<div class="tile">No active warnings for BA14 🎉</div>';
        return;
      }

      hits.forEach(f => {
        const props = f.properties || {};
        const d = document.createElement('div');
        d.className = 'tile';
        d.innerHTML = `
          <h3>${escapeHtml(props.headline || props.event || 'Warning')}</h3>
          <div class="muted" style="margin:6px 0">${escapeHtml(props.description || '')}</div>
          <div><strong>Severity:</strong> ${escapeHtml(props.severity || '-')}
          &nbsp;•&nbsp;<strong>Colour:</strong> ${escapeHtml(props.warning_colour || props.colour || '-')}</div>
          <div class="muted">From ${fmtTime(props.effective || props.onset)} to ${fmtTime(props.expires)}</div>
        `;
        listEl.appendChild(d);
      });

    }catch(err){
      console.error(err);
      const e = document.createElement('div');
      e.className = 'error';
      e.textContent = 'Could not load Met Office warnings. Check your key and feed URL in alerts-config.js.';
      listEl.appendChild(e);
    }
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function fmtTime(iso){ if (!iso) return '—'; const d = new Date(iso); return d.toLocaleString('en-GB',{ timeZone:'Europe/London'}); }

  // Geo helpers
  function intersectsPoint(geom, pt){ // pt: [lon,lat]
    if (!geom) return false;
    const type = geom.type;
    if (type === 'Polygon') return inPoly(geom.coordinates[0], pt);
    if (type === 'MultiPolygon') return geom.coordinates.some(poly => inPoly(poly[0], pt));
    if (type === 'GeometryCollection') return (geom.geometries||[]).some(g => intersectsPoint(g, pt));
    return false;
  }
  function inPoly(ring, pt){
    // Ray casting; ring is array of [lon,lat]
    let x = pt[0], y = pt[1], inside = false;
    for (let i=0, j=ring.length-1; i<ring.length; j=i++){
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi>y)!==(yj>y)) && (x < (xj - xi) * (y - yi) / ((yj - yi)||1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Auto-load when Alerts tab becomes visible
  document.addEventListener('click', (e)=>{
    if (e.target && e.target.dataset && e.target.dataset.tab === 'alerts'){
      setTimeout(loadAlerts, 0);
    }
  });

})();