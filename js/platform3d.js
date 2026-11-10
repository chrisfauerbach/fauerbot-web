// Fauerbot platforms: a 3D model of any robot, built from its profile (src/fauerbot_robot/robots/<name>.yaml,
// exported to js/platforms-data.js by scripts/platforms_page.py). Same numbers the simulator uses: wheel positions,
// track, deck, sensor mounts, mast and solar roof. The styling (shell, light seam, fenders) is illustration.
// Three.js is y-up. Robot x (forward) = three x; robot z (up) = three y; robot y (left) = three -z.
(function (global) {
  "use strict";

  function roundedRect(THREE, x0, y0, x1, y1, r) {
    const s = new THREE.Shape();
    s.moveTo(x0 + r, y0);
    s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r);
    s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
    s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r);
    s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  }

  // A rounded rectangle in the robot's plan [x0, y0, x1, y1, corner] (x forward, y left), extruded upward from z0 by
  // h, with rounded edges. The bevel grows a shape outward, so the shape is inset by it first: the slab keeps its size.
  function slab(THREE, rect, z0, h, bevel, mat) {
    const b = Math.min(bevel, h * 0.45);
    const [x0, y0, x1, y1, r] = rect;
    const shape = roundedRect(THREE, x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.002, r - b));
    const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, h - 2 * b), bevelEnabled: b > 0, bevelThickness: b,
      bevelSize: b, bevelSegments: 14, curveSegments: 28 });
    g.rotateX(-Math.PI / 2);          // shape (x, y) -> three (x, up, -y)
    const m = new THREE.Mesh(g, mat);
    m.position.y = z0 + b;
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  function decal(THREE, text, accent, w, h) {
    const c = document.createElement("canvas");
    c.width = 1024; c.height = Math.round(1024 * h / w);
    const g = c.getContext("2d");
    g.font = `800 ${Math.round(c.height * 0.62)}px "Bricolage Grotesque", "Arial Black", sans-serif`;
    g.textBaseline = "middle";
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.fillText(text.toUpperCase(), c.height * 0.25, c.height * 0.54);
    const tw = g.measureText(text.toUpperCase()).width;
    g.fillStyle = accent;
    g.fillRect(c.height * 0.25 + tw + c.height * 0.2, c.height * 0.3, c.height * 0.5, c.height * 0.5);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  }

  function solarTexture(THREE) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 384;
    const g = c.getContext("2d");
    g.fillStyle = "#0d1b3a"; g.fillRect(0, 0, 512, 384);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
      g.fillStyle = (i + j) % 2 ? "#14295a" : "#112452";
      g.fillRect(i * 64 + 3, j * 64 + 3, 58, 58);
    }
    g.strokeStyle = "rgba(190,210,255,0.35)"; g.lineWidth = 1;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
      for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(i * 64 + 3, j * 64 + k * 16); g.lineTo(i * 64 + 61, j * 64 + k * 16); g.stroke(); }
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // Build one robot. d: an entry of window.FAUERBOT_PLATFORMS.
  function buildPlatform(THREE, d, opts) {
    opts = opts || {};
    const root = new THREE.Group();
    root.name = d.name;
    // r128 treats hex colours as linear; the page's colours are sRGB, so convert or they render washed out.
    const accent = new THREE.Color(d.accent).convertSRGBToLinear();
    const seamColor = new THREE.Color(opts.seamColor || "#7fe3ff").convertSRGBToLinear();

    const shellMat = new THREE.MeshPhysicalMaterial({ color: accent, metalness: 0.15, roughness: 0.38, clearcoat: 1.0, clearcoatRoughness: 0.1 });
    const graphite = new THREE.MeshStandardMaterial({ color: 0x1b1f24, metalness: 0.4, roughness: 0.5 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xc4c9cf, metalness: 0.55, roughness: 0.3 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x0a0f15, metalness: 0.3, roughness: 0.06 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.0, roughness: 0.92 });
    const white = new THREE.MeshStandardMaterial({ color: 0xeef1f3, metalness: 0.1, roughness: 0.35 });
    const seamMat = new THREE.MeshStandardMaterial({ color: seamColor, emissive: seamColor, emissiveIntensity: 1.8, roughness: 0.3 });
    const red = new THREE.MeshStandardMaterial({ color: 0xd8231b, roughness: 0.35 });

    const dk = d.deck, dr = d.drive;
    const deckBot = dk.z - dk.height / 2, deckTop = dk.z + dk.height / 2;
    const fx = dk.x + dk.length / 2, rx = dk.x - dk.length / 2, hw = dk.width / 2;
    const corner = Math.min(0.12, dk.width * 0.28);

    // Skirt (blade guard): dark, tucked in, down to just above the grass.
    const skirtBot = Math.min(0.05, deckBot - 0.01);
    root.add(slab(THREE, [rx + 0.015, -hw + 0.015, fx - 0.015, hw - 0.015, corner], skirtBot, deckBot - skirtBot + 0.02, 0.01, graphite));
    // Shell: the accent body, rounded on top.
    const shell = slab(THREE, [rx, -hw, fx, hw, corner], deckBot, dk.height, Math.min(0.05, dk.height * 0.35), shellMat);
    root.add(shell);
    // Light seam all the way round, just above the skirt. Cyan = RTK fixed.
    const seam = slab(THREE, [rx - 0.004, -hw - 0.004, fx + 0.004, hw + 0.004, corner + 0.004], deckBot + 0.012, 0.008, 0, seamMat);
    seam.castShadow = false;
    root.add(seam);
    // Visor: a dark glass canopy on top, set back from the nose.
    const vl = dk.length * 0.42, vw = dk.width * 0.62;
    const vx = dk.x - dk.length * 0.06;
    root.add(slab(THREE, [vx - vl / 2, -vw / 2, vx + vl / 2, vw / 2, Math.min(0.06, vw * 0.3)], deckTop - 0.012, 0.03, 0.014, glass));
    // Nose: a dark "face" panel with the camera / 2D lidar window.
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.012, dk.height * 0.32, dk.width * 0.62), glass);
    face.position.set(fx + 0.002, deckBot + dk.height * 0.42, 0);
    root.add(face);
    const faceLine = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.008, dk.width * 0.5), seamMat);
    faceLine.position.set(fx + 0.003, deckBot + dk.height * 0.42, 0);
    root.add(faceLine);

    // Name decals on both flanks.
    const dw = Math.min(dk.length * 0.72, 0.52), dh = dw * 0.2;
    [1, -1].forEach((s) => {
      const m = decal(THREE, d.title, d.accentDark || "#111", dw, dh);
      m.position.set(dk.x - dk.length * 0.05, deckBot + dk.height * 0.5, s * (hw + 0.0015));
      m.rotation.y = s > 0 ? 0 : Math.PI;
      if (dr.type !== "differential") { m.scale.setScalar(0.7); m.position.y = deckTop - dh * 0.6; }   // above the fenders / track guards
      root.add(m);
    });

    // Drive.
    const R = dr.wheel_radius, W = dr.wheel_width;
    if (dr.type === "tracked") {
      const a = Math.min(...dr.wheels_x) - R, b = Math.max(...dr.wheels_x) + R;
      [1, -1].forEach((s) => {
        const zc = -s * dr.track / 2;
        const outer = roundedRect(THREE, a, 0.0, b, 2 * R, R - 0.0005);
        outer.holes.push(roundedRect(THREE, a + 0.022, 0.022, b - 0.022, 2 * R - 0.022, R - 0.023));
        const belt = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: W, bevelEnabled: false, curveSegments: 24 }), rubber);
        belt.position.z = zc - W / 2;
        belt.castShadow = true;
        root.add(belt);
        // grousers on the top and bottom runs
        for (let x = a + R; x <= b - R + 1e-6; x += 0.045) {
          [0.004, 2 * R - 0.004].forEach((y) => {
            const gr = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, W), rubber);
            gr.position.set(x, y, zc);
            root.add(gr);
          });
        }
        dr.wheels_x.forEach((wx) => {
          const rw = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.024, R - 0.024, W * 0.8, 32), steel);
          rw.rotation.x = Math.PI / 2;
          rw.position.set(wx, R, zc);
          root.add(rw);
        });
        // track guard
        const guard = new THREE.Mesh(new THREE.BoxGeometry(b - a + 0.02, 0.012, W + 0.02), shellMat);
        guard.position.set((a + b) / 2, 2 * R + 0.02, zc);
        guard.castShadow = true;
        root.add(guard);
      });
    } else {
      dr.wheels_x.forEach((wx) => {
        [1, -1].forEach((s) => {
          const zc = -s * dr.track / 2;
          const tyre = new THREE.Mesh(new THREE.CylinderGeometry(R, R, W, 48), rubber);
          tyre.rotation.x = Math.PI / 2;
          tyre.position.set(wx, R, zc);
          tyre.castShadow = true;
          root.add(tyre);
          // tread blocks
          for (let i = 0; i < 24; i++) {
            const th = (i / 24) * Math.PI * 2;
            const blk = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, W * 0.9), rubber);
            blk.position.set(wx + Math.cos(th) * R, R + Math.sin(th) * R, zc);
            blk.rotation.z = th;
            root.add(blk);
          }
          const hub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.6, R * 0.6, W + 0.004, 32), steel);
          hub.rotation.x = Math.PI / 2;
          hub.position.set(wx, R, zc);
          root.add(hub);
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.28, R * 0.28, W + 0.01, 24), shellMat);
          cap.rotation.x = Math.PI / 2;
          cap.position.set(wx, R, zc);
          root.add(cap);
          // fender over the wheel
          const fr = R + 0.025;
          const fender = new THREE.Mesh(new THREE.CylinderGeometry(fr, fr, W + 0.03, 40, 1, true, Math.PI / 2 + 0.35, Math.PI - 0.7),
            new THREE.MeshPhysicalMaterial({ color: accent, metalness: 0.25, roughness: 0.32, clearcoat: 1, side: THREE.DoubleSide }));
          fender.rotation.x = Math.PI / 2;
          fender.position.set(wx, R, zc);
          fender.castShadow = true;
          root.add(fender);
        });
      });
    }
    (dr.casters || []).forEach(([cx, cy]) => {
      const cr = dr.caster_radius;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(cr, cr, 0.03, 24), rubber);
      w.rotation.x = Math.PI / 2;
      w.position.set(cx, cr, -cy);
      root.add(w);
      const fork = new THREE.Mesh(new THREE.BoxGeometry(0.02, Math.max(0.01, deckBot - cr), 0.045), graphite);
      fork.position.set(cx, cr + (deckBot - cr) / 2, -cy);
      root.add(fork);
    });

    // Sensors.
    const s = d.sensors;
    const post = (x, y, z0, z1, r, mat) => {
      if (z1 - z0 < 0.005) return;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, z1 - z0, 20), mat || graphite);
      p.position.set(x, (z0 + z1) / 2, -y);
      p.castShadow = true;
      root.add(p);
    };
    if (d.mast) post(d.mast.x, 0, deckTop, d.mast.height, 0.018, steel);
    if (d.solar) {
      const sp = d.solar;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(sp.length, 0.012, sp.width),
        [graphite, graphite, new THREE.MeshStandardMaterial({ map: solarTexture(THREE), metalness: 0.5, roughness: 0.15 }), graphite, graphite, graphite]);
      panel.position.set(sp.x, Math.max(sp.z, deckTop + 0.02) + 0.006, 0);
      panel.castShadow = true;
      root.add(panel);
    }
    const roof = d.solar ? Math.max(d.solar.z, deckTop + 0.02) + 0.012 : deckTop;
    const l3 = s.lidar3d;
    if (l3) {
      const lh = 0.065;
      if (!d.mast) post(l3.x, l3.y || 0, roof - 0.01, l3.z - lh / 2, 0.016);
      const lg = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, lh, 40), graphite);
      const win = new THREE.Mesh(new THREE.CylinderGeometry(0.0345, 0.0345, lh * 0.45, 40), glass);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.0018, 8, 48), seamMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = lh * 0.3;
      lg.add(body, win, ring);
      lg.position.set(l3.x, l3.z, -(l3.y || 0));
      lg.rotation.z = -((l3.pitch_deg || 0) * Math.PI / 180);
      lg.children.forEach((c) => (c.castShadow = true));
      root.add(lg);
    }
    const gn = s.gnss;
    if (gn) {
      const onMast = d.mast && Math.abs(gn.x - d.mast.x) < 0.02;
      if (!onMast) post(gn.x, gn.y || 0, roof - 0.01, gn.z - 0.012, 0.009, steel);
      else post(gn.x, 0, (l3 ? l3.z + 0.033 : deckTop), gn.z - 0.012, 0.009, steel);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.048, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), white);
      dome.scale.set(1, 0.55, 1);
      dome.position.set(gn.x, gn.z - 0.012, -(gn.y || 0));
      dome.castShadow = true;
      root.add(dome);
    }
    const cam = s.camera;
    if (cam && (cam.z > deckTop + 0.01 || cam.x > fx - 0.02)) {
      const cg = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.07), graphite);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 20), glass);
      lens.rotation.z = Math.PI / 2;
      lens.position.x = 0.017;
      cg.add(box, lens);
      cg.position.set(Math.min(cam.x, fx + 0.005), Math.max(cam.z, deckTop - 0.01), -(cam.y || 0));
      cg.rotation.z = -((cam.pitch_deg || 0) * Math.PI / 180);
      root.add(cg);
    }
    // Stop button at the back, reachable without going near the blade.
    const sb = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.02, 32), red);
    sb.position.set(rx + Math.min(0.09, dk.length * 0.18), roof + 0.006, 0);
    sb.castShadow = true;
    root.add(sb);
    const sbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.032, 0.008, 32), new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.4 }));
    sbBase.position.set(sb.position.x, roof - 0.001, 0);
    root.add(sbBase);

    root.userData.bounds = { xMin: Math.min(d.x_min, rx), xMax: Math.max(d.x_max, fx), halfWidth: d.half_width, height: d.height };
    return root;
  }

  // A scene: "lawn" (outdoors, striped lawn, fog) or "studio" (transparent background, soft shadow only).
  function buildStage(THREE, renderer, mode, span) {
    const M1 = global.FauerbotM1;
    const scene = new THREE.Scene();
    scene.environment = M1.environment(THREE, renderer, "day");
    const studio = mode === "studio";
    if (!studio) {
      scene.background = new THREE.Color("#cfe3f2");
      scene.fog = new THREE.Fog(scene.background, 4 + span * 2, 16 + span * 4);
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80),
      studio ? new THREE.ShadowMaterial({ opacity: 0.28 }) : new THREE.MeshStandardMaterial({ map: M1.lawnTexture(THREE, false), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const sun = new THREE.DirectionalLight(0xfff6e8, 1.35);
    sun.position.set(-3, 6, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const e = Math.max(1.5, span * 0.75);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -e;
    sun.shadow.camera.right = sun.shadow.camera.top = e;
    sun.shadow.camera.far = 30;
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xcfe2f5, 0x3d6630, 0.4));
    return scene;
  }

  // Point a camera at a robot so its bounding sphere fills the frame. dir: the direction from the robot to the camera.
  function frame(THREE, camera, obj, dir, fill) {
    const box = new THREE.Box3().setFromObject(obj);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const v = new THREE.Vector3(...dir).normalize();
    const fov = (camera.fov * Math.PI) / 180;
    const fovMin = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * camera.aspect));
    const dist = sphere.radius / Math.sin(fovMin / 2) / (fill || 1);
    camera.position.copy(sphere.center).addScaledVector(v, dist);
    camera.lookAt(sphere.center);
    camera.near = dist / 50; camera.far = dist * 20;
    camera.updateProjectionMatrix();
    return sphere;
  }

  global.FauerbotPlatforms = { buildPlatform, buildStage, frame };
})(window);
