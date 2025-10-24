(function(){
  var w = window;
  var doc = document;
  var loaderPromise = null;

  function parseCenter(str) {
    if (!str) return null;
    try {
      var parts = String(str).split(',');
      if (parts.length >= 2) {
        var lat = parseFloat(parts[0]);
        var lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) return {lat: lat, lng: lng};
      }
    } catch (e) {}
    return null;
  }

  function hidePlaceholderFor(el){
    if (!el) return;
    // If wrapped, hide an overlay placeholder inside wrapper
    var wrap = el.closest('.cm-map-wrap');
    if (wrap){
      var ph = wrap.querySelector('.gm-placeholder');
      if (ph) ph.style.display = 'none';
    } else {
      // Fallback: hide sibling placeholder
      var prev = el.previousElementSibling;
      if (prev && prev.classList && prev.classList.contains('gm-placeholder')) prev.style.display = 'none';
    }
  }

  function loadGoogleMaps(apiKey) {
    if (w.google && w.google.maps) return Promise.resolve();
    if (loaderPromise) return loaderPromise;
    loaderPromise = new Promise(function(resolve, reject){
      var s = doc.createElement('script');
      var base = 'https://maps.googleapis.com/maps/api/js';
      var src = base + '?v=weekly&libraries=maps,geocoding&loading=async';
      if (apiKey) src += '&key=' + encodeURIComponent(apiKey);
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error('Failed to load Google Maps')); };
      (doc.head || doc.body || doc.documentElement).appendChild(s);
    });
    return loaderPromise;
  }

  function initOne(el) {
    var apiKey = el.getAttribute('data-api-key') || '';
    var centerStr = el.getAttribute('data-center') || '';
    var zoom = parseInt(el.getAttribute('data-zoom') || '6', 10);
    var address = el.getAttribute('data-address') || '';
    var styleJsonAttr = el.getAttribute('data-stylejson') || '';
    var mapColor = el.getAttribute('data-mapcolor') || '';
    var center = parseCenter(centerStr) || {lat: 51.0, lng: 10.0};

    function ensureMapCtor(maxWaitMs){
      var start = Date.now();
      return new Promise(function(resolve, reject){
        (function poll(){
          try {
            if (w.google && w.google.maps) {
              if (typeof w.google.maps.importLibrary === 'function') {
                w.google.maps.importLibrary('maps').then(function(ns){
                  var MapCtor = ns && ns.Map ? ns.Map : (w.google.maps && w.google.maps.Map);
                  if (typeof MapCtor === 'function') return resolve(MapCtor);
                  if (Date.now() - start > maxWaitMs) return reject(new Error('Map ctor unavailable after import'));
                  return setTimeout(poll, 60);
                }).catch(function(){
                  if (Date.now() - start > maxWaitMs) return reject(new Error('importLibrary failed'));
                  setTimeout(poll, 60);
                });
                return;
              }
              if (typeof w.google.maps.Map === 'function') return resolve(w.google.maps.Map);
            }
          } catch(e) {}
          if (Date.now() - start > maxWaitMs) return reject(new Error('google maps not ready'));
          setTimeout(poll, 60);
        })();
      });
    }

    loadGoogleMaps(apiKey).then(function(){
      if (!el || !el.parentNode) return;
      return ensureMapCtor(3000).then(function(MapCtor){
        try {
          hidePlaceholderFor(el);
          var opts = { zoom: zoom, center: center, mapTypeControl: false, fullscreenControl: true };
          // Apply styles from attributes
          if (styleJsonAttr) {
            try { opts.styles = JSON.parse(styleJsonAttr); } catch(e) {}
          }
          if (!opts.styles && mapColor) {
            opts.styles = [
              { elementType: 'geometry', stylers: [{ color: mapColor }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: mapColor }] },
              { featureType: 'poi', stylers: [{ visibility: 'off' }] }
            ];
          }
          var map = new MapCtor(el, opts);
          var markersJson = el.getAttribute('data-markers') || '[]';
          var markers = [];
          try { markers = JSON.parse(markersJson); } catch(e) { markers = []; }
          if (markers && markers.length) {
            var bounds = new (w.google && w.google.maps && w.google.maps.LatLngBounds ? w.google.maps.LatLngBounds : function(){ this.extend=function(){}; this.isEmpty=function(){return true}; this.getCenter=function(){return center}; })();
            for (var i=0;i<markers.length;i++) {
              var m = markers[i];
              if (!m || typeof m.lat !== 'number' || typeof m.lng !== 'number') continue;
              var pos = {lat:m.lat, lng:m.lng};
              try {
                if (w.google && w.google.maps && typeof w.google.maps.Marker === 'function') {
                  new w.google.maps.Marker({position: pos, map: map, title: m.title || ''});
                }
                if (w.google && w.google.maps && typeof w.google.maps.LatLng === 'function' && typeof bounds.extend === 'function') {
                  bounds.extend(new w.google.maps.LatLng(pos.lat, pos.lng));
                }
              } catch(e) {}
            }
            try {
              if (typeof map.fitBounds === 'function' && markers.length > 1) map.fitBounds(bounds);
              else if (markers.length === 1 && typeof map.setCenter === 'function') map.setCenter({lat: markers[0].lat, lng: markers[0].lng});
            } catch(e) {}
          }

          // If no markers and an address is provided, geocode it and show a marker
          if ((!markers || !markers.length) && address) {
            var finishGeocode = function(GeocoderCtor){
              try {
                var geocoder = GeocoderCtor ? new GeocoderCtor() : (w.google && w.google.maps && w.google.maps.Geocoder ? new w.google.maps.Geocoder() : null);
                if (!geocoder || typeof geocoder.geocode !== 'function') return;
                geocoder.geocode({ address: address }, function(results, status){
                  try {
                    if (status === 'OK' && results && results[0]) {
                      var loc = results[0].geometry && results[0].geometry.location;
                      if (loc) {
                        var lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
                        var lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
                        var p = {lat: lat, lng: lng};
                        if (typeof map.setCenter === 'function') map.setCenter(p);
                        if (w.google && w.google.maps && typeof w.google.maps.Marker === 'function') {
                          new w.google.maps.Marker({position: p, map: map, title: address});
                        }
                      }
                    }
                  } catch(e) {}
                });
              } catch(e) {}
            };
            if (w.google && w.google.maps && typeof w.google.maps.importLibrary === 'function') {
              w.google.maps.importLibrary('geocoding').then(function(ns){ finishGeocode(ns && ns.Geocoder ? ns.Geocoder : null); }).catch(function(){ finishGeocode(null); });
            } else {
              finishGeocode(null);
            }
          }
        } catch(e){ if (w.console && console.warn) console.warn('Map init failed:', e && e.message ? e.message : e); }
      });
    }).catch(function(err){ if (w.console && console.warn) console.warn('Maps load failed:', err && err.message ? err.message : err); });
  }

  function initAll() {
    var nodes = doc.querySelectorAll('.cm-map');
    if (!nodes || !nodes.length) return;
    var firstKey = '';
    nodes.forEach ? nodes.forEach(function(n){ if (!firstKey) firstKey = n.getAttribute('data-api-key') || ''; }) : null;
    loadGoogleMaps(firstKey).then(function(){
      for (var i=0; i<nodes.length; i++) initOne(nodes[i]);
    }).catch(function(err){ if (w.console && console.warn) console.warn('CM maps init error:', err); });
  }

  // Trigger automatically when this script is included (via consent bar)
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Optional manual trigger
  w.WebsailingGoogleMapInit = initAll;
})();
