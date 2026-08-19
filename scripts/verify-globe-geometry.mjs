const RAD = Math.PI / 180;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function latLonToVec(lat, lon) {
  const phi = lat * RAD;
  const lambda = lon * RAD;
  const cp = Math.cos(phi);
  return { x: cp * Math.sin(lambda), y: Math.sin(phi), z: cp * Math.cos(lambda) };
}
function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
function normalize(v){const l=Math.hypot(v.x,v.y,v.z);return {x:v.x/l,y:v.y/l,z:v.z/l};}
function slerp(a,b,t){const na=normalize(a),nb=normalize(b);const o=Math.acos(clamp(dot(na,nb),-1,1));if(o<1e-8)return na;const so=Math.sin(o);const a1=Math.sin((1-t)*o)/so,a2=Math.sin(t*o)/so;return normalize({x:na.x*a1+nb.x*a2,y:na.y*a1+nb.y*a2,z:na.z*a1+nb.z*a2});}
function vecToLatLon(v){const n=normalize(v);return {lat:Math.asin(n.y)/RAD,lon:Math.atan2(n.x,n.z)/RAD};}
function rotate(v,yaw,pitch){const cy=Math.cos(yaw),sy=Math.sin(yaw);const x=cy*v.x+sy*v.z,z=-sy*v.x+cy*v.z,y=v.y;const cx=Math.cos(pitch),sx=Math.sin(pitch);return {x,y:cx*y-sx*z,z:sx*y+cx*z};}
function cross(a,b){return {x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};}
function sub(a,b){return {x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};}
function spherePoint(lat,lon){return latLonToVec(lat/RAD,lon/RAD);}

// Representative sphere triangle with the V6 winding: a, a+1, b.
const lat=-0.1, lat2=0.0, lon=0.0, lon2=0.1;
const a=spherePoint(lat,lon), nextLon=spherePoint(lat,lon2), b=spherePoint(lat2,lon);
const n=cross(sub(nextLon,a),sub(b,a));
const centroid={x:(a.x+nextLon.x+b.x)/3,y:(a.y+nextLon.y+b.y)/3,z:(a.z+nextLon.z+b.z)/3};
if(dot(n,centroid)<=0) throw new Error('Sphere winding is not outward-facing.');

const seoul=latLonToVec(37.5665,126.9780);
const tokyo=latLonToVec(35.6762,139.6503);
const mid=vecToLatLon(slerp(seoul,tokyo,0.5));
const yaw=-mid.lon*RAD, pitch=mid.lat*RAD;
const rs=rotate(seoul,yaw,pitch), rt=rotate(tokyo,yaw,pitch);
if(rs.z<=0 || rt.z<=0) throw new Error('Seoul/Tokyo are not on the camera-facing hemisphere.');
console.log('PASS sphere winding: outward (CCW)');
console.log(`PASS route focus midpoint: ${mid.lat.toFixed(3)}°, ${mid.lon.toFixed(3)}°`);
console.log(`PASS camera-facing z: Seoul=${rs.z.toFixed(4)}, Tokyo=${rt.z.toFixed(4)}`);
