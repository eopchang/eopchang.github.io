/* Gargantua — a real-time ray-traced Schwarzschild black hole for the home hero.
   Light rays are integrated through curved space (null geodesics), so the
   accretion disk is lensed into the arcs above and below the shadow.
   Falls back to the static poster image when WebGL is unavailable. */
(function () {
  "use strict";
  var canvas = document.querySelector("[data-gargantua]");
  if (!canvas) return;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" }) ||
           canvas.getContext("experimental-webgl");
  if (!gl) return;

  var VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes; uniform float uTime; uniform vec2 uLook; uniform vec2 uShift; uniform float uZoom;",
    "const float RIN = 2.6; const float ROUT = 13.0;",
    "float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }",
    "float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),",
    "             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }",
    "float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }",

    "vec3 stars(vec3 d){",
    "  vec3 col = vec3(0.0);",
    "  for (int k = 0; k < 2; k++){",
    "    float sc = k == 0 ? 90.0 : 220.0;",
    "    vec3 p = d * sc; vec3 id = floor(p); vec3 f = fract(p) - 0.5;",
    "    float h = hash(id + float(k) * 19.0);",
    "    if (h > (k == 0 ? 0.972 : 0.955)){",
    "      vec3 off = vec3(hash(id + 1.3), hash(id + 2.7), hash(id + 5.1)) - 0.5;",
    "      float dist = length(f - off * 0.55);",
    "      float b = smoothstep(k == 0 ? 0.16 : 0.11, 0.0, dist) * (0.35 + 0.65 * hash(id + 9.1));",
    "      vec3 tint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.86, 0.66), hash(id + 3.3));",
    "      col += tint * b * (k == 0 ? 1.5 : 0.7);",
    "    }",
    "  }",
    "  float band = exp(-pow(dot(d, normalize(vec3(0.35, 1.0, 0.25))) * 2.6, 2.0));",
    "  col += vec3(0.045, 0.05, 0.075) * band * fbm(d * 5.0);",
    "  return col;",
    "}",

    "vec3 disk(vec3 p, vec3 dir, out float a){",
    "  float r = length(p.xz);",
    "  float t = clamp((r - RIN) / (ROUT - RIN), 0.0, 1.0);",
    "  float ang = atan(p.z, p.x) - uTime * 3.2 * pow(r, -1.5);",
    "  float n = fbm(vec3(cos(ang) * 1.3, sin(ang) * 1.3, r * 1.7)) * 0.65 + fbm(vec3(cos(ang) * 4.6, sin(ang) * 4.6, r * 5.2)) * 0.45;",
    "  float edgeIn = smoothstep(0.0, 0.05, t);",
    "  float edgeOut = 1.0 - smoothstep(0.45, 1.0, t);",
    "  float I = pow(1.0 - t, 2.3) * edgeIn * edgeOut;",
    "  vec3 c = mix(vec3(1.0, 0.88, 0.70), vec3(1.0, 0.62, 0.27), smoothstep(0.0, 0.32, t));",
    "  c = mix(c, vec3(0.6, 0.23, 0.07), smoothstep(0.3, 1.0, t));",
    "  vec3 v = normalize(vec3(-p.z, 0.0, p.x));",
    "  float dop = 1.0 + 0.24 * dot(v, -dir);",
    "  float dens = smoothstep(0.28, 0.86, n);",
    "  a = clamp(I * 1.7 * (0.3 + dens), 0.0, 1.0);",
    "  return c * I * (0.35 + 1.5 * dens) * dop * 2.4;",
    "}",

    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * uZoom - uShift;",
    "  float roll = -0.06 + uLook.x * 0.02;",
    "  uv = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * uv;",
    "  float el = 0.085 + uLook.y * 0.035 + 0.01 * sin(uTime * 0.05);",
    "  float az = uLook.x * 0.18;",
    "  float D = 27.0;",
    "  vec3 ro = vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el)) * D;",
    "  vec3 fw = normalize(-ro);",
    "  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));",
    "  vec3 up = cross(rt, fw);",
    "  vec3 rd = normalize(fw * 1.55 + rt * uv.x + up * uv.y);",
    "  vec3 pos = ro; vec3 vel = rd;",
    "  vec3 hc = cross(pos, vel); float h2 = dot(hc, hc);",
    "  vec3 col = vec3(0.0); float alpha = 0.0; bool hole = false;",
    "  for (int i = 0; i < 220; i++){",
    "    float r2 = dot(pos, pos);",
    "    if (r2 < 1.0){ hole = true; break; }",
    "    float r = sqrt(r2);",
    "    float dt = clamp(0.06 * r, 0.02, 1.4);",
    "    vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;",
    "    vec3 np = pos + vel * dt;",
    "    if (pos.y * np.y < 0.0){",
    "      vec3 c = mix(pos, np, pos.y / (pos.y - np.y));",
    "      float rc = length(c.xz);",
    "      if (rc > RIN && rc < ROUT){",
    "        float a; vec3 dc = disk(c, normalize(vel), a);",
    "        col += (1.0 - alpha) * dc; alpha += (1.0 - alpha) * a;",
    "        if (alpha > 0.985) break;",
    "      }",
    "    }",
    "    float rr = length(np.xz);",
    "    col += (1.0 - alpha) * vec3(1.0, 0.62, 0.3) * 0.016 * dt * exp(-abs(np.y) * 3.0) * smoothstep(ROUT, RIN, rr) * step(RIN * 0.85, rr);",
    "    pos = np;",
    "    if (r2 > 1900.0 && dot(pos, vel) > 0.0) break;",
    "  }",
    "  if (!hole) col += (1.0 - alpha) * stars(normalize(vel));",
    "  col = 1.0 - exp(-col * 1.3);",
    "  col = pow(col, vec3(0.92));",
    "  vec2 q = gl_FragCoord.xy / uRes;",
    "  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.22);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(prog, "uRes"), uTime = gl.getUniformLocation(prog, "uTime"),
      uLook = gl.getUniformLocation(prog, "uLook"), uShift = gl.getUniformLocation(prog, "uShift"),
      uZoom = gl.getUniformLocation(prog, "uZoom");

  // render below native resolution and let CSS scale it up; adapt to the device
  var scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
  var minScale = 0.28, maxScale = Math.min(window.devicePixelRatio || 1, 2) * 0.85;
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(2, Math.round(w * scale));
    canvas.height = Math.max(2, Math.round(h * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    // Frame the hole exactly like the still poster underneath (object-fit: cover),
    // so the live render fades in without a double image.
    // Wide poster 1920x1080: hole right of the title. Tall poster 1080x1920: hole
    // pulled back and lifted above the title.
    // same test as the <picture> media query (viewport aspect), so both pick the same framing
    var wide = window.innerWidth / window.innerHeight > 1.15;
    var Wr = wide ? 1920 : 1080, Hr = wide ? 1080 : 1920;
    var zoomR = wide ? 1.0 : 1.28, s = Math.max(w / Wr, h / Hr);
    gl.uniform1f(uZoom, h / (s * Hr) * zoomR);
    gl.uniform2f(uShift, wide ? 0.22 : 0.0, wide ? 0.05 : 0.192);
  }
  resize();
  window.addEventListener("resize", resize);

  var look = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  if (!reduceMotion) {
    window.addEventListener("pointermove", function (e) {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);
  }

  var t0 = performance.now(), frames = 0, acc = 0, lastT = t0, shown = false;

  // Probe the GPU with a few synchronous frames; weak devices keep the still poster.
  function probe() {
    for (var tries = 0; tries < 4; tries++) {
      var s = performance.now();
      gl.uniform1f(uTime, 18.0);
      gl.uniform2f(uLook, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.finish();
      var ms = performance.now() - s;
      if (ms < 40) return true;
      if (scale <= minScale) return ms < 120;
      scale = Math.max(minScale, scale * Math.sqrt(30 / ms));
      resize();
    }
    return false;
  }
  if (!probe()) { canvas.remove(); return; }

  function frame(now) {
    var dtMs = now - lastT; lastT = now;
    look.x += (target.x - look.x) * 0.03;
    look.y += (target.y - look.y) * 0.03;
    gl.uniform1f(uTime, reduceMotion ? 18.0 : (now - t0) / 1000 + 18.0);
    gl.uniform2f(uLook, look.x, -look.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!shown) { shown = true; canvas.classList.add("is-live"); }
    // adaptive resolution: aim for ~45fps
    frames++; acc += dtMs;
    if (frames === 20) {
      var avg = acc / frames;
      if (avg > 28 && scale > minScale) { scale = Math.max(minScale, scale * 0.8); resize(); }
      else if (avg < 14 && scale < maxScale) { scale = Math.min(maxScale, scale * 1.12); resize(); }
      frames = 0; acc = 0;
    }
  }
  if (reduceMotion) { requestAnimationFrame(frame); return; }
  (function loop(now) {
    if (visible && !document.hidden) frame(now); else lastT = now;
    requestAnimationFrame(loop);
  })(performance.now());
})();
