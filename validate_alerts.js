const fs = require('fs');
const path = require('path');

const R = 6371000; // earth radius meters
const NM_IN_METERS = 1852;

function toRad(d){ return d * Math.PI / 180; }
function toDeg(r){ return r * 180 / Math.PI; }

function haversineDistance(a, b){
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDL = Math.sin(dLat/2), sinDW = Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(sinDL*sinDL + Math.cos(lat1)*Math.cos(lat2)*sinDW*sinDW), Math.sqrt(1 - (sinDL*sinDL + Math.cos(lat1)*Math.cos(lat2)*sinDW*sinDW)));
  return R * c;
}

function bearing(a, b){
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const Δλ = toRad(b.lon - a.lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);
  return Math.atan2(y, x);
}

function parsePointWKT(wkt){
  // POINT(lon lat)
  const m = wkt.match(/POINT\s*\(([-0-9.]+)\s+([-0-9.]+)\)/i);
  if(!m) throw new Error('invalid POINT WKT: ' + wkt);
  return { lon: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

function parseLineStringWKT(wkt){
  // LINESTRING(lon lat, lon lat, ...)
  const m = wkt.match(/LINESTRING\s*\((.+)\)/i);
  if(!m) throw new Error('invalid LINESTRING WKT: ' + wkt);
  return m[1].split(',').map(s => {
    const parts = s.trim().split(/\s+/);
    return { lon: parseFloat(parts[0]), lat: parseFloat(parts[1]) };
  });
}

function distancePointToSegmentMeters(p, a, b){
  // using great-circle cross-track distance and along-track to check projection
  const d13 = haversineDistance(a, p) / R; // angular distance
  const θ12 = bearing(a, b);
  const θ13 = bearing(a, p);
  const sin_xt = Math.sin(d13) * Math.sin(θ13 - θ12);
  let d_xt = Math.asin(Math.max(-1, Math.min(1, sin_xt))) * R; // signed meters
  const abs_xt = Math.abs(d_xt);

  // along-track distance from a to projected point
  const d_at = Math.acos(Math.max(-1, Math.min(1, Math.cos(d13) / Math.cos(d_xt / R)))) * R;
  const seg_len = haversineDistance(a, b);

  if(d_at >= 0 && d_at <= seg_len){
    return abs_xt; // projection falls within segment
  }
  // otherwise distance is min to endpoints
  const da = haversineDistance(p, a);
  const db = haversineDistance(p, b);
  return Math.min(da, db);
}

function findMinDistanceToLine(p, linePoints){
  let min = Infinity, minSeg = null;
  for(let i=0;i<linePoints.length-1;i++){
    const a = linePoints[i];
    const b = linePoints[i+1];
    const d = distancePointToSegmentMeters(p, a, b);
    if(d < min){ min = d; minSeg = {a,b,i}; }
  }
  return { meters: min, seg: minSeg };
}

function loadData(){
  const p = path.join(__dirname, 'sessions.json');
  const raw = fs.readFileSync(p, 'utf8');
  const parsed = JSON.parse(raw);
  // file is an array of session responses; each item has data with session-specific arrays
  const combined = {
    session_routes: [],
    session_route_waypoints: [],
    alert_thresholds: [],
    session_ownship: []
  };
  for(const item of parsed){
    if(!item || !item.data) continue;
    const d = item.data;
    if(d.session_routes) combined.session_routes.push(...d.session_routes);
    if(d.session_route_waypoints) combined.session_route_waypoints.push(...d.session_route_waypoints);
    if(d.alert_thresholds) combined.alert_thresholds.push(...d.alert_thresholds);
    if(d.session_ownship) combined.session_ownship.push(...d.session_ownship);
  }
  return combined;
}

function getThresholdForSession(thresholds, session_id){
  return thresholds.find(t => t.session_id === session_id) || null;
}

function checkOwnshipPoints(ownships, data){
  const routes = data.session_routes || [];
  const thresholds = data.alert_thresholds || [];
  const outputs = [];

  for(const p of ownships){
    const sessionRoutes = routes.filter(r => r.session_id === p.session_id);
    if(sessionRoutes.length === 0){
      outputs.push({ point: p, error: 'no routes for session' });
      continue;
    }
    // check against each route, pick minimal distance
    let best = {nm: Infinity, route: null, meters: Infinity};
    for(const r of sessionRoutes){
      const line = parseLineStringWKT(r.route_line);
      const res = findMinDistanceToLine({lat: p.lat, lon: p.lon}, line);
      const nm = res.meters / NM_IN_METERS;
      if(nm < best.nm){ best = { nm, route: r, meters: res.meters } }
    }

    // determine threshold: prefer route.max_xte_threshold_nm if present, else session thresholds
    let threshold_nm = null;
    if(best.route && typeof best.route.max_xte_threshold_nm === 'number'){
      threshold_nm = best.route.max_xte_threshold_nm;
    } else {
      const ts = getThresholdForSession(thresholds, p.session_id);
      if(ts){
        threshold_nm = ts.xte_high_nm != null ? ts.xte_high_nm : (ts.xte_critical_nm || null);
      }
    }

    // decide alert level
    let alert = 'none';
    let level = null;
    const sessionThresh = getThresholdForSession(thresholds, p.session_id);
    if(sessionThresh){
      if(best.nm <= 0) best.nm = 0;
      if(best.nm <= (best.route && best.route.max_xte_threshold_nm != null ? best.route.max_xte_threshold_nm : Infinity)){
        // inside route-specific threshold -> none
        alert = 'none';
      } else {
        // compare to session thresholds if available
        if(sessionThresh.xte_critical_nm != null && best.nm >= sessionThresh.xte_critical_nm){
          alert = 'critical'; level = sessionThresh.xte_critical_nm;
        } else if(sessionThresh.xte_high_nm != null && best.nm >= sessionThresh.xte_high_nm){
          alert = 'high'; level = sessionThresh.xte_high_nm;
        } else {
          alert = 'exceeded'; level = threshold_nm; // exceeded route threshold but below session levels
        }
      }
    } else if(threshold_nm != null){
      alert = best.nm > threshold_nm ? 'exceeded' : 'none';
    } else {
      alert = 'no_thresholds';
    }

    outputs.push({ point: p, route_id: best.route ? best.route.id : null, distance_nm: Number(best.nm.toFixed(4)), threshold_nm: threshold_nm, alert, session_level_match: level });
  }
  return outputs;
}

// Use actual ownship points from the sessions file as samples (limit to first 20)
function buildSampleOwnships(data){
  const arr = (data.session_ownship || []).slice(0, 50).map(o => ({ id: 'own-'+o.id, session_id: o.session_id, lat: o.latitude, lon: o.longitude }));
  // if no ownship points found, fall back to a small synthetic set
  if(arr.length === 0){
    return [
      { id: 'own-1', session_id: 1, lat: 27.7172, lon: 85.324 },
      { id: 'own-2', session_id: 1, lat: 12.95, lon: 135.50 },
      { id: 'own-3', session_id: 2, lat: 43.5, lon: 6.0 }
    ];
  }
  return arr;
}

function main(){
  const data = loadData();
  const sampleOwnships = buildSampleOwnships(data);
  const results = checkOwnshipPoints(sampleOwnships, data);
  console.log('Validation results:');
  for(const r of results){
    if(r.error){
      console.log(`- ${r.point.id}: ERROR: ${r.error}`);
    } else {
      console.log(`- ${r.point.id} (session ${r.point.session_id}) -> route ${r.route_id}, distance ${r.distance_nm} nm, threshold ${r.threshold_nm} nm, alert=${r.alert}${r.session_level_match ? ' (session level '+r.session_level_match+' nm)' : ''}`);
    }
  }
}

main();
