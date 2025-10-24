// DTV-specific Google Map init (consent-managed)
(function(){
  var w = window, doc = document;
  var loaderPromise = null;

  function parseCenter(str){
    if (!str) return null;
    var p = String(str).split(',');
    if (p.length >= 2){
      var lat = parseFloat(p[0]); var lng = parseFloat(p[1]);
      if (!isNaN(lat) && !isNaN(lng)) return {lat: lat, lng: lng};
    }
    return null;
  }

  function hidePlaceholder(el){
    if (!el) return;
    var wrap = el.closest('.cm-map-wrap') || el.closest('.ce_google_map');
    if (wrap){
      var ph = wrap.querySelector('.gm-placeholder');
      if (ph) ph.style.display = 'none';
    }
  }

  function loadGoogleMaps(apiKey){
    if (w.google && w.google.maps) return Promise.resolve();
    if (loaderPromise) return loaderPromise;
    loaderPromise = new Promise(function(resolve, reject){
      var s = doc.createElement('script');
      var src = 'https://maps.googleapis.com/maps/api/js?v=weekly&libraries=maps,geocoding&loading=async';
      if (apiKey) src += '&key=' + encodeURIComponent(apiKey);
      s.src = src; s.async = true; s.defer = true;
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error('GMaps load failed')); };
      (doc.head || doc.body || doc.documentElement).appendChild(s);
    });
    return loaderPromise;
  }

  function ensureMapCtor(maxWait){
    var start = Date.now();
    return new Promise(function(resolve, reject){
      (function poll(){
        try {
          if (w.google && w.google.maps){
            if (typeof w.google.maps.importLibrary === 'function'){
              return w.google.maps.importLibrary('maps').then(function(ns){
                var C = (ns && ns.Map) ? ns.Map : (w.google.maps && w.google.maps.Map);
                if (typeof C === 'function') return resolve(C);
                if (Date.now()-start > maxWait) return reject(new Error('Map ctor timeout'));
                setTimeout(poll, 60);
              }).catch(function(){ setTimeout(poll, 60); });
            }
            if (typeof w.google.maps.Map === 'function') return resolve(w.google.maps.Map);
          }
        } catch(e){}
        if (Date.now()-start > maxWait) return reject(new Error('GMaps not ready'));
        setTimeout(poll, 60);
      })();
    });
  }

  function readLegacyProps(el){
    var lat = parseFloat(el.getAttribute('data-lat')||'0')||0;
    var lng = parseFloat(el.getAttribute('data-lng')||'0')||0;
    var center = {lat: lat, lng: lng};
    var zoom = parseInt(el.getAttribute('data-zoom')||'10',10)||10;
    var showMarker = (el.getAttribute('data-marker')||'0')==='1';
    var title = el.getAttribute('data-title')||'';
    var addr = el.getAttribute('data-address')||'';
    var styleJson = el.getAttribute('data-stylejson')||'';
    var mapColor = el.getAttribute('data-mapcolor')||'';
    return {center:center, zoom:zoom, markers: showMarker? [{lat:center.lat, lng:center.lng, title:title||addr}]:[], address: addr, styleJson: styleJson, mapColor: mapColor};
  }

  function readCmProps(el){
    var center = parseCenter(el.getAttribute('data-center')) || {lat:51.0, lng:10.0};
    var zoom = parseInt(el.getAttribute('data-zoom')||'10',10)||10;
    var addr = el.getAttribute('data-address')||'';
    var styleJson = el.getAttribute('data-stylejson')||'';
    var mapColor = el.getAttribute('data-mapcolor')||'';
    var markers = [];
    try { markers = JSON.parse(el.getAttribute('data-markers')||'[]')||[]; } catch(e) { markers = []; }
    return {center:center, zoom:zoom, markers:markers, address: addr, styleJson: styleJson, mapColor: mapColor};
  }

  function applyStyles(opts, styleJson, mapColor){
    if (styleJson){ try{ opts.styles = JSON.parse(styleJson); }catch(e){} }
    if (!opts.styles && mapColor){
      opts.styles = [
        { elementType: 'geometry', stylers: [{ color: mapColor }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: mapColor }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] }
      ];
    }
  }

  function initOne(el){
    var isLegacy = el.classList.contains('js-gmap');
    var props = isLegacy ? readLegacyProps(el) : readCmProps(el);
    var opts = {zoom: props.zoom, center: props.center, mapTypeControl:false, fullscreenControl:true};
    applyStyles(opts, props.styleJson, props.mapColor);

    return ensureMapCtor(3000).then(function(MapCtor){
      hidePlaceholder(el);
      var map = new MapCtor(el, opts);
      var bounds = (w.google && w.google.maps && w.google.maps.LatLngBounds) ? new w.google.maps.LatLngBounds() : null;

      if (props.markers && props.markers.length){
        props.markers.forEach(function(m){
          if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
          var pos = {lat:m.lat, lng:m.lng};
          if (w.google && w.google.maps && w.google.maps.Marker) new w.google.maps.Marker({position:pos, map:map, title: m.title||''});
          if (bounds && w.google && w.google.maps && w.google.maps.LatLng) bounds.extend(new w.google.maps.LatLng(pos.lat, pos.lng));
        });
        if (props.markers.length>1 && bounds && typeof map.fitBounds==='function') map.fitBounds(bounds);
        if (props.markers.length===1 && typeof map.setCenter==='function') map.setCenter({lat:props.markers[0].lat, lng:props.markers[0].lng});
        return;
      }

      // Geocode address if no markers
      if (props.address){
        var finishGeocode = function(GeocoderCtor){
          try{
            var geocoder = GeocoderCtor ? new GeocoderCtor() : (w.google && w.google.maps && w.google.maps.Geocoder ? new w.google.maps.Geocoder() : null);
            if (!geocoder || !geocoder.geocode) return;
            geocoder.geocode({address: props.address}, function(results, status){
              try{
                if (status==='OK' && results && results[0]){
                  var loc = results[0].geometry && results[0].geometry.location;
                  if (loc){
                    var lat = typeof loc.lat==='function' ? loc.lat() : loc.lat;
                    var lng = typeof loc.lng==='function' ? loc.lng() : loc.lng;
                    var p = {lat:lat, lng:lng};
                    if (typeof map.setCenter==='function') map.setCenter(p);
                    if (w.google && w.google.maps && w.google.maps.Marker) new w.google.maps.Marker({position:p, map:map, title: props.address});
                  }
                }
              }catch(e){}
            });
          }catch(e){}
        };
        if (w.google && w.google.maps && typeof w.google.maps.importLibrary==='function'){
          w.google.maps.importLibrary('geocoding').then(function(ns){ finishGeocode(ns && ns.Geocoder ? ns.Geocoder : null); }).catch(function(){ finishGeocode(null); });
        } else {
          finishGeocode(null);
        }
      }
    });
  }

  function findAllNodes(){
    var list = Array.prototype.slice.call(doc.querySelectorAll('.cm-map, .js-gmap'));
    return list;
  }

  function detectApiKey(){
    var nodes = findAllNodes();
    for (var i=0;i<nodes.length;i++){
      var k = nodes[i].getAttribute('data-api-key');
      if (k) return k;
    }
    return '';
  }

  function initAll(){
    var apiKey = detectApiKey();
    loadGoogleMaps(apiKey).then(function(){
      var nodes = findAllNodes();
      var chain = Promise.resolve();
      nodes.forEach(function(el){ chain = chain.then(function(){ return initOne(el); }); });
      return chain;
    }).catch(function(err){ if (w.console && console.warn) console.warn('GMap init error:', err && err.message ? err.message : err); });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', initAll); else initAll();
  w.WebsailingGoogleMapInit = initAll;
})();
