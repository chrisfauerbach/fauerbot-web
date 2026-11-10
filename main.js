// Hero: a top-down yard where the mower cuts boustrophedon stripes inside an RTK geofence.
// Scale: 40 px = 1 m. The robot drives at 0.5 m/s of sim time; the animation runs sim time at 8x.
(function () {
  const canvas = document.getElementById("lawn");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const PX_PER_M = 40, SPEED_MPS = 0.5, TIME_SCALE = 8;
  const SWATH = 0.36 * PX_PER_M;              // blade diameter, as in the sim model
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Geofence: the lawn minus the flowerbed corner (an L-shape, like a real yard polygon).
  const fence = { x0: 56, y0: 64, x1: 584, y1: 432 };
  const bed = { x0: 444, y0: 366, x1: 584, y1: 432 };
  const ro = {
    cov: document.getElementById("ro-cov"),
    t: document.getElementById("ro-t"),
  };

  // Deterministic noise, so every visitor sees the same lawn.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // ---- lanes ----
  const path = [];
  let lane = 0;
  for (let y = fence.y0 + SWATH / 2; y <= fence.y1 - SWATH / 2 + 0.1; y += SWATH * 0.95, lane++) {
    const inBedRows = y + SWATH / 2 > bed.y0;
    const xa = fence.x0 + SWATH / 2;
    const xb = (inBedRows ? bed.x0 : fence.x1) - SWATH / 2;
    const [s, e] = lane % 2 === 0 ? [xa, xb] : [xb, xa];
    path.push({ x: s, y, lane }, { x: e, y, lane });
  }
  const segs = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len, start: total, lane: b.lane, turn: a.lane !== b.lane });
    total += len;
  }

  // ---- static layers ----
  const lawn = document.createElement("canvas");
  lawn.width = W; lawn.height = H;
  const lc = lawn.getContext("2d");
  lc.fillStyle = "#4f8a3a"; lc.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    const x = rand() * W, y = rand() * H, g = 110 + rand() * 50;
    lc.strokeStyle = `rgba(${40 + rand() * 30},${g},${40 + rand() * 25},0.55)`;
    lc.beginPath(); lc.moveTo(x, y); lc.lineTo(x + (rand() - 0.5) * 3, y - 3 - rand() * 4); lc.stroke();
  }

  const cut = document.createElement("canvas");
  cut.width = W; cut.height = H;
  const cc = cut.getContext("2d");
  cc.lineCap = "round"; cc.lineWidth = SWATH;

  function stripeColor(l) { return l % 2 === 0 ? "#86bf63" : "#6aa64c"; }

  let drawnTo = 0; // distance already painted onto the cut layer
  function paintCut(upto) {
    for (const s of segs) {
      if (s.start + s.len <= drawnTo) continue;
      if (s.start >= upto) break;
      const t0 = Math.max(0, (drawnTo - s.start) / s.len), t1 = Math.min(1, (upto - s.start) / s.len);
      cc.strokeStyle = s.turn ? stripeColor(s.a.lane) : stripeColor(s.lane);
      cc.beginPath();
      cc.moveTo(s.a.x + (s.b.x - s.a.x) * t0, s.a.y + (s.b.y - s.a.y) * t0);
      cc.lineTo(s.a.x + (s.b.x - s.a.x) * t1, s.a.y + (s.b.y - s.a.y) * t1);
      cc.stroke();
    }
    drawnTo = upto;
  }

  function poseAt(d) {
    for (const s of segs) {
      if (d <= s.start + s.len) {
        const t = (d - s.start) / s.len;
        return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t, th: Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x) };
      }
    }
    const last = segs[segs.length - 1];
    return { x: last.b.x, y: last.b.y, th: Math.atan2(last.b.y - last.a.y, last.b.x - last.a.x) };
  }

  function drawScene(d) {
    ctx.drawImage(lawn, 0, 0);
    // cut stripes, clipped to the geofence so round caps never spill outside it
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fence.x0, fence.y0); ctx.lineTo(fence.x1, fence.y0); ctx.lineTo(fence.x1, bed.y0);
    ctx.lineTo(bed.x0, bed.y0); ctx.lineTo(bed.x0, fence.y1); ctx.lineTo(fence.x0, fence.y1); ctx.closePath();
    ctx.clip();
    ctx.drawImage(cut, 0, 0);
    ctx.restore();

    // fence
    ctx.strokeStyle = "#8a6a45"; ctx.lineWidth = 6;
    ctx.strokeRect(22, 26, W - 44, H - 52);
    // house corner, top-left
    ctx.fillStyle = "#cfc8b8"; ctx.fillRect(22, 26, 120, 30);
    ctx.fillStyle = "#8f3d2f"; ctx.fillRect(22, 26, 120, 8);
    // flowerbed
    ctx.fillStyle = "#5c4029"; ctx.fillRect(bed.x0 + 10, bed.y0 + 12, bed.x1 - bed.x0 - 4, bed.y1 - bed.y0 - 10);
    const flowers = ["#e0457f", "#f2c614", "#9b4fd6", "#f2c614", "#e0457f"];
    flowers.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bed.x0 + 32 + i * 24, bed.y0 + 38, 7, 0, 7); ctx.fill(); });
    // tree, outside the fence line of the geofence
    ctx.fillStyle = "rgba(20,40,20,0.28)"; ctx.beginPath(); ctx.ellipse(608, 74, 34, 22, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#2e6b34"; ctx.beginPath(); ctx.arc(598, 62, 30, 0, 7); ctx.fill();
    ctx.fillStyle = "#3d8443"; ctx.beginPath(); ctx.arc(590, 54, 16, 0, 7); ctx.fill();

    // RTK geofence, dashed blue
    ctx.setLineDash([8, 6]); ctx.strokeStyle = "#2a6fd0"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fence.x0, fence.y0); ctx.lineTo(fence.x1, fence.y0); ctx.lineTo(fence.x1, bed.y0);
    ctx.lineTo(bed.x0, bed.y0); ctx.lineTo(bed.x0, fence.y1); ctx.lineTo(fence.x0, fence.y1); ctx.closePath();
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#2a6fd0"; ctx.font = "500 11px 'IBM Plex Mono', monospace";
    ctx.fillText("RTK geofence", fence.x0 + 2, fence.y1 + 16);

    // scale bar: 2 m
    ctx.fillStyle = "#fbfcfa"; ctx.fillRect(30, H - 20, 2 * PX_PER_M, 4);
    ctx.font = "500 11px 'IBM Plex Mono', monospace"; ctx.fillText("2 m", 30 + 2 * PX_PER_M + 6, H - 14);

    // robot
    const p = poseAt(d);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.th);
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(-11, -8, 26, 20);
    ctx.fillStyle = "#c8221c"; ctx.beginPath(); ctx.roundRect(-13, -10, 26, 20, 4); ctx.fill();
    ctx.fillStyle = "#151515"; ctx.fillRect(-10, -12, 8, 3); ctx.fillRect(-10, 9, 8, 3);
    ctx.fillStyle = "#f0692a"; ctx.beginPath(); ctx.arc(4, 0, 3.5, 0, 7); ctx.fill(); // GNSS antenna puck
    ctx.restore();

    const frac = Math.min(1, d / total);
    ro.cov.textContent = `${Math.round(frac * 100)}%`;
    ro.t.textContent = `${(d / PX_PER_M / SPEED_MPS).toFixed(1)} s`;
  }

  // Complete at rest: start partway through, so the first frame already shows stripes.
  let dist = total * (reduceMotion ? 0.62 : 0.34);
  paintCut(dist);
  drawScene(dist);
  if (reduceMotion) return;

  let last = null, pauseUntil = 0, running = false;
  function frame(ts) {
    if (!running) return;
    if (last === null) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    if (ts < pauseUntil) { requestAnimationFrame(frame); return; }
    dist += SPEED_MPS * PX_PER_M * TIME_SCALE * dt;
    if (dist >= total) {
      dist = total; paintCut(dist); drawScene(dist);
      pauseUntil = ts + 2500;
      setTimeout(() => { cc.clearRect(0, 0, W, H); drawnTo = 0; dist = 0; }, 2400);
    } else {
      paintCut(dist); drawScene(dist);
    }
    requestAnimationFrame(frame);
  }
  // Only animate while the hero is on screen.
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; last = null; requestAnimationFrame(frame); }
    else if (!e.isIntersecting) { running = false; }
  }).observe(canvas);
})();


// Engineering diagram tabs (roving selection, arrow keys move between tabs).
(function () {
  const tabs = Array.from(document.querySelectorAll('.diagram-tabs [role="tab"]'));
  if (!tabs.length) return;
  function select(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      select(next); next.focus();
    });
  });
})();

// M1 3D viewer: drag to orbit, slow auto-rotate, day/night toggle. Falls back to the still render without WebGL.
(function () {
  const canvas = document.getElementById("m1-viewer");
  if (!canvas || !window.THREE || !window.FauerbotM1) return;
  const fig = canvas.closest(".viewer");
  const btn = document.getElementById("m1-mode");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (e) {
    return; // no WebGL: the fallback image stays
  }
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(30, 12 / 7, 0.01, 100);
  let scene, night = false;
  function build() {
    scene = FauerbotM1.buildScene(THREE, renderer, { mode: night ? "night" : "day" }).scene;
    renderer.toneMappingExposure = night ? 0.9 : 0.85;
  }
  build();
  fig.classList.add("is-live");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let az = -0.68, el = 0.24, dist = 1.45, dragging = false, lastX = 0, lastY = 0, dirty = true;
  function place() {
    camera.position.set(Math.cos(az) * Math.cos(el) * dist, 0.12 + Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist);
    camera.lookAt(0, 0.11, 0);
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    az += (e.clientX - lastX) * 0.008;
    el = Math.min(1.2, Math.max(0.05, el + (e.clientY - lastY) * 0.005));
    lastX = e.clientX; lastY = e.clientY; dirty = true;
  });
  const stop = () => { dragging = false; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  btn.addEventListener("click", () => {
    night = !night;
    btn.setAttribute("aria-pressed", String(night));
    btn.textContent = night ? "Day" : "Night";
    build(); dirty = true;
  });

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  function loop() {
    if (visible) {
      if (!dragging && !reduce) { az += 0.0025; dirty = true; }
      if (dirty) { place(); renderer.render(scene, camera); dirty = false; }
    }
    requestAnimationFrame(loop);
  }
  resize(); place(); renderer.render(scene, camera);
  requestAnimationFrame(loop);
})();
