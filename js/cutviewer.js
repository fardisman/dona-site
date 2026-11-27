/* DONA — interactive 3D cut of a candy (WebGL2, no libraries).
   Loads the brand's own cut model (quantized glTF, gzip), lets the visitor turn and zoom it. */
(function () {
'use strict';
const VS = `#version 300 es
in vec3 p; in vec3 n; in vec2 u; uniform mat4 VP, Mo; uniform mat3 Mn; out vec3 wp; out vec3 wn; out vec2 vu;
void main(){ vec4 w = Mo*vec4(p,1.); wp = w.xyz; wn = Mn*n; vu = u; gl_Position = VP*w; }`;
const FS = `#version 300 es
precision highp float; in vec3 wp; in vec3 wn; in vec2 vu; out vec4 o;
uniform sampler2D T, MR, NM; uniform vec3 cam; uniform float hasNM;
vec3 env(vec3 r){ float h = smoothstep(-.3,.9,r.y);
  vec3 c = mix(vec3(.06,.045,.035), vec3(.95,.9,.84), h);
  c += vec3(2.6,2.4,2.1)*pow(max(dot(r,normalize(vec3(.45,.8,.4))),0.),14.);
  c += vec3(1.2,1.0,.85)*pow(max(dot(r,normalize(vec3(-.7,.35,-.5))),0.),8.);
  return c; }
vec3 perturb(vec3 N, vec3 V, vec2 uv){
  vec3 m = texture(NM, uv).xyz*2.-1.;
  vec3 dp1 = dFdx(wp), dp2 = dFdy(wp); vec2 du1 = dFdx(uv), du2 = dFdy(uv);
  vec3 dp2p = cross(dp2, N), dp1p = cross(N, dp1);
  vec3 Tt = dp2p*du1.x + dp1p*du2.x, B = dp2p*du1.y + dp1p*du2.y;
  float inv = inversesqrt(max(dot(Tt,Tt), dot(B,B)) + 1e-20);
  return normalize(mat3(Tt*inv, B*inv, N) * m);
}
void main(){
  vec3 base = pow(texture(T,vu).rgb, vec3(2.2));
  vec3 mr = texture(MR,vu).rgb; float rgh = clamp(mr.g, .25, 1.);
  vec3 N = normalize(wn); if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cam-wp);
  if(hasNM > .5) N = perturb(N, V, vu);
  vec3 L = normalize(vec3(.45,.85,.4)), L2 = normalize(vec3(-.6,.4,-.5)), L3 = normalize(cam - wp);
  float d = max(dot(N,L),0.)*.85 + max(dot(N,L2),0.)*.3 + max(dot(N,L3),0.)*.25 + .16;
  vec3 R = reflect(-V,N);
  float fr = .04 + .96*pow(1.-max(dot(N,V),0.),5.);
  vec3 spec = env(R)*fr*(1.-rgh)*1.3 + vec3(1.,.95,.88)*pow(max(dot(R,L),0.), mix(80.,8.,rgh))*(1.-rgh)*.5;
  vec3 c = (base*d + spec)*1.12;
  c = (c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);
  o = vec4(pow(clamp(c,0.,1.),vec3(1./2.2)), 1.);
}`;
const M = {
 persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2); return [t / a,0,0,0, 0,t,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0]; },
 look(e, c, u) { let z = nrm(sub(e, c)), x = nrm(cross(u, z)), y = cross(z, x); return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,e),-dot(y,e),-dot(z,e),1]; },
 mul(a, b) { const r = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k*4+j] * b[i*4+k]; r[i*4+j] = s; } return r; }
};
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]} function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]} function nrm(a){const l=Math.hypot(...a)||1;return [a[0]/l,a[1]/l,a[2]/l]}

async function fetchGz(url, onp) {
 const r = await fetch(url); if (!r.ok) throw new Error('load ' + r.status);
 const total = +r.headers.get('content-length') || 0; let got = 0;
 const counted = r.body.pipeThrough(new TransformStream({transform(ch, c) { got += ch.byteLength; total && onp && onp(got / total); c.enqueue(ch); }}));
 const raw = await new Response(counted).arrayBuffer(), u8 = new Uint8Array(raw, 0, 2);
 // the host may already have un-gzipped it on the way (Content-Encoding)
 if (u8[0] !== 0x1f || u8[1] !== 0x8b) return raw;
 return new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}

class CutViewer {
 constructor(host, k, yaw0) {
  this.host = host; this.k = k; this.yaw0 = yaw0 ?? 0; this.yaw = this.yaw0; this.t = 0; this.pitch = .35; this.zoom = 1; this.auto = true; this.vy = 0; this.vp = 0;
  host.innerHTML = '<canvas aria-label="3D"></canvas><div class="ld"><div><span data-en="Loading 3D model…" data-uz="3D model yuklanmoqda…">Загружаем 3D-модель…</span><b><i></i></b></div></div><div class="zoom"><button type="button" data-z="-1" aria-label="+">+</button><button type="button" data-z="1" aria-label="−">−</button></div><p class="hint" data-en="Drag to turn · pinch or scroll to zoom" data-uz="Aylantirish uchun suring · yaqinlashtirish uchun chimdiring">Крутите пальцем или мышью · приближайте колесом или щипком</p>';
  window.DONA && DONA.setLang(DONA.lang);
  this.cv = host.querySelector('canvas'); this.bar = host.querySelector('.ld i');
  host.querySelectorAll('.zoom button').forEach(b => b.onclick = () => { this.zoom = Math.max(.45, Math.min(1.6, this.zoom * (b.dataset.z < 0 ? .82 : 1.22))); this.auto = false; this.draw(); });
  this.load().catch(e => { host.querySelector('.ld span').textContent = 'Не удалось загрузить 3D'; console.error(e); });
 }
 async load() {
  const b = await fetchGz(`/models/cut-${this.k}.glb.gz`, p => this.bar.style.width = (p * 100).toFixed(0) + '%');
  const dv = new DataView(b), L = dv.getUint32(12, true), j = JSON.parse(new TextDecoder().decode(new Uint8Array(b, 20, L))), off = 20 + L + 8;
  const gl = this.gl = this.cv.getContext('webgl2', {antialias: true, alpha: true, premultipliedAlpha: true});
  if (!gl) throw new Error('webgl2');
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(x); return x; };
  const pr = this.prog = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(pr, 0, 'p'); gl.bindAttribLocation(pr, 1, 'n'); gl.bindAttribLocation(pr, 2, 'u'); gl.linkProgram(pr); gl.useProgram(pr);
  const view = i => { const v = j.bufferViews[i]; return new Uint8Array(b, off + (v.byteOffset || 0), v.byteLength); };
  const prim = j.meshes[0].primitives[0], A = j.accessors;
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const attr = (ai, loc, size) => { const a = A[ai], bv = j.bufferViews[a.bufferView], buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, view(a.bufferView), gl.STATIC_DRAW);
   gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, a.componentType, !!a.normalized, bv.byteStride || 0, 0); };
  attr(prim.attributes.POSITION, 0, 3); attr(prim.attributes.NORMAL, 1, 3); attr(prim.attributes.TEXCOORD_0, 2, 2);
  const ia = A[prim.indices]; const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, view(ia.bufferView), gl.STATIC_DRAW);
  this.count = ia.count; this.itype = ia.componentType;
  const nd = j.nodes[0], t = nd.translation || [0,0,0], s = (nd.scale || [1,1,1])[0];
  const pa = A[prim.attributes.POSITION], lo = pa.min.map((v, i) => v * s + t[i]), hi = pa.max.map((v, i) => v * s + t[i]);
  this.c = [(lo[0]+hi[0])/2, (lo[1]+hi[1])/2, (lo[2]+hi[2])/2]; this.rad = Math.hypot(hi[0]-lo[0], hi[1]-lo[1], hi[2]-lo[2]) / 2;
  this.node = {t, s};
  const mat = j.materials[prim.material || 0], pbr = mat.pbrMetallicRoughness;
  const img = ti => { const im = j.images[j.textures[ti].source]; return createImageBitmap(new Blob([view(im.bufferView)], {type: im.mimeType}), {imageOrientation: 'none'}); };
  const tex = async (ti, unit, srgb) => { const bm = await img(ti); const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bm); gl.generateMipmap(gl.TEXTURE_2D);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   const an = gl.getExtension('EXT_texture_filter_anisotropic'); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8); };
  await tex(pbr.baseColorTexture.index, 0); await tex(pbr.metallicRoughnessTexture.index, 1);
  this.hasNM = !!mat.normalTexture; if (this.hasNM) await tex(mat.normalTexture.index, 2);
  const U = n => gl.getUniformLocation(pr, n); this.U = U;
  gl.uniform1i(U('T'), 0); gl.uniform1i(U('MR'), 1); gl.uniform1i(U('NM'), 2); gl.uniform1f(U('hasNM'), this.hasNM ? 1 : 0);
  gl.enable(gl.DEPTH_TEST);
  this.host.querySelector('.ld').style.opacity = 0;
  this.controls(); this.ready = true;
  new ResizeObserver(() => this.draw()).observe(this.cv);
  this.io = new IntersectionObserver(e => { this.vis = e[0].isIntersecting; if (this.vis) this.tick(); }); this.io.observe(this.cv);
 }
 controls() {
  const cv = this.cv, pts = new Map(); let last = 0, d0 = 0, z0 = 1;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); this.auto = false; if (pts.size === 2) { const [a, b] = [...pts.values()]; d0 = Math.hypot(a[0]-b[0], a[1]-b[1]); z0 = this.zoom; } });
  cv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1]; pts.set(e.pointerId, [e.clientX, e.clientY]);
   if (pts.size === 1) { this.vy = dx * .008; this.vp = dy * .006; this.yaw += this.vy; this.pitch = Math.max(-1.2, Math.min(1.35, this.pitch + this.vp)); }
   else if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0]-b[0], a[1]-b[1]); this.zoom = Math.max(.45, Math.min(1.6, z0 * d0 / d)); }
   this.draw(); });
  const up = e => { pts.delete(e.pointerId); this.tick(); }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); this.auto = false; this.zoom = Math.max(.45, Math.min(1.6, this.zoom * Math.exp(e.deltaY * .0012))); this.draw(); }, {passive: false});
  cv.addEventListener('dblclick', () => { this.zoom = 1; this.pitch = .35; this.yaw0 = this.yaw; this.t = 0; this.auto = true; this.tick(); });
 }
 tick() {
  if (this._raf || !this.ready) return;
  const step = () => { this._raf = 0; if (!this.vis) return;
   let moving = false;
   if (this.auto) { this.t += .01; this.yaw = this.yaw0 + Math.sin(this.t) * .75; moving = true; }
   else if (Math.abs(this.vy) > .0003) { this.yaw += this.vy; this.vy *= .93; moving = true; }
   this.draw(); if (moving) this._raf = requestAnimationFrame(step); };
  this._raf = requestAnimationFrame(step);
 }
 draw() {
  if (!this.ready) return; const gl = this.gl, cv = this.cv, dpr = Math.min(2, devicePixelRatio || 1);
  const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr); if (!w || !h) return;
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const fov = .5, asp = w / h, dist = this.rad / Math.sin(fov / 2) * .64 * this.zoom / Math.min(1, asp);
  const c = this.c, cp = Math.cos(this.pitch), eye = [c[0] + Math.sin(this.yaw) * cp * dist, c[1] + Math.sin(this.pitch) * dist, c[2] + Math.cos(this.yaw) * cp * dist];
  const VP = M.mul(M.persp(fov, asp, dist * .05, dist * 6), M.look(eye, c, [0, 1, 0]));
  const {t, s} = this.node, Mo = [s,0,0,0, 0,s,0,0, 0,0,s,0, t[0],t[1],t[2],1];
  const U = this.U; gl.uniformMatrix4fv(U('VP'), false, VP); gl.uniformMatrix4fv(U('Mo'), false, Mo); gl.uniformMatrix3fv(U('Mn'), false, [1,0,0, 0,1,0, 0,0,1]); gl.uniform3fv(U('cam'), eye);
  gl.drawElements(gl.TRIANGLES, this.count, this.itype, 0);
 }
}
window.CutViewer = CutViewer;
})();
