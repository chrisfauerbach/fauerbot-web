// Fauerbot M1: procedural 3D model of the "liquid chrome" shell, plus a studio/yard scene.
// One source for the product renders (design/render.html) and the website's interactive viewer.
// Units are metres. Three.js is y-up; the mower faces +x, its left is -z.
// Dimensions follow the sim model (src/fauerbot_description): wheel radius 0.12, track 0.50, deck ~0.60 x 0.42.
(function (global) {
  "use strict";

  const DIM = {
    noseX: 0.48,      // front of the shell, from the rear axle
    tailX: -0.22,     // back of the shell
    centreX: 0.0,     // widest point right over the axle, so the shell hides the wheels
    halfW: 0.315,     // half width at the widest point (track 0.50 + tyre: the wheels tuck under the lip)
    shellTop: 0.245,  // top of the dome, from the ground
    seamY: 0.10,      // the lip: where the chrome shell overhangs the skirt
    skirtBottom: 0.03,
    wheelR: 0.12,
    track: 0.50,
  };

  // Top-view outline: a reverse teardrop, broad over the drive wheels and tapering to the nose.
  // theta=0 points forward (+x).
  function outline(theta, scale) {
    const c = Math.cos(theta), s = Math.sin(theta);
    const n = 3.0;  // superellipse exponent: 2 = ellipse, higher = squarer shoulders
    const x0 = DIM.centreX;
    // Blend the front and rear half-lengths smoothly across the sides. A hard switch at c = 0 leaves a curvature
    // break, and a mirror finish shows every curvature break as a visible crease.
    const k = Math.min(1, Math.max(0, (c + 0.5) / 1.0));
    const blend = k * k * (3 - 2 * k);
    const fx = (x0 - DIM.tailX) + ((DIM.noseX - x0) - (x0 - DIM.tailX)) * blend;
    const x = x0 + Math.sign(c) * fx * Math.pow(Math.abs(c), 2 / n);
    const taper = 1 - 0.34 * Math.max(0, c) * Math.max(0, c);  // narrower toward the nose
    const z = Math.sign(s) * DIM.halfW * taper * Math.pow(Math.abs(s), 2 / n);
    return [x0 + (x - x0) * scale, z * scale];
  }

  // The upper shell: radial grid (u = 0 at the crown, 1 at the seam) x angle.
  function shellGeometry(THREE, segU, segV) {
    const pos = [], idx = [];
    const crownX = 0.02;  // the crown sits over the axle: the shape "leans forward"
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      // dome profile: height falls off like a flattened superellipse
      // Lens profile: a long, shallow dome that curls tightly into a crisp rim at the lip.
      const h = DIM.seamY + (DIM.shellTop - DIM.seamY) * Math.pow(1 - Math.pow(u, 2.2), 0.62);
      for (let j = 0; j <= segV; j++) {
        const th = (j / segV) * Math.PI * 2;
        const [ox, oz] = outline(th, 1);
        // blend from the crown point to the outline as u goes 0 -> 1
        const ease = Math.sin(u * Math.PI / 2);
        const x = crownX + (ox - crownX) * ease;
        const z = oz * ease;
        // Haunches: smooth swells over each drive wheel (0.24 m tall tyres under a 0.245 m shell), fading out
        // before the lip so the rim line stays clean.
        const bump = 0.062 * Math.exp(-((x * x) / (2 * 0.12 * 0.12)) - ((Math.abs(z) - 0.25) ** 2) / (2 * 0.06 * 0.06));
        pos.push(x, h + bump * (1 - Math.pow(u, 10)), z);
      }
    }
    for (let i = 0; i < segU; i++) {
      for (let j = 0; j < segV; j++) {
        const a = i * (segV + 1) + j, b = a + segV + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);  // counter-clockwise seen from outside: normals face out
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // The lower skirt (blade guard): a band from the seam down to just above the grass, slightly tucked in.
  function skirtGeometry(THREE, segV) {
    const pos = [], idx = [];
    // Tucked well inside the lip (0.93): the overhang throws a shadow line, and the body seems to float.
    const rows = [[DIM.seamY - 0.002, 0.93], [0.06, 0.925], [DIM.skirtBottom, 0.9]];
    rows.forEach(([y, sc]) => {
      for (let j = 0; j <= segV; j++) {
        const [x, z] = outline((j / segV) * Math.PI * 2, sc);
        pos.push(x, y, z);
      }
    });
    for (let r = 0; r < rows.length - 1; r++) {
      for (let j = 0; j < segV; j++) {
        const a = r * (segV + 1) + j, b = a + segV + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function seamCurve(THREE, scale, y) {
    const pts = [];
    for (let j = 0; j < 160; j++) {
      const [x, z] = outline((j / 160) * Math.PI * 2, scale);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }

  function buildMower(THREE, opts) {
    opts = opts || {};
    const seamColor = new THREE.Color(opts.seamColor || "#7fe3ff");
    const root = new THREE.Group();
    root.name = "fauerbot-m1";

    const chrome = new THREE.MeshStandardMaterial({ color: 0xf2f4f7, metalness: 1.0, roughness: 0.035, envMapIntensity: 1.25 });
    const graphite = new THREE.MeshStandardMaterial({ color: 0x1b1f24, metalness: 0.35, roughness: 0.55 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x0b1016, metalness: 0.2, roughness: 0.05 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x111214, metalness: 0.0, roughness: 0.9 });
    const seamMat = new THREE.MeshStandardMaterial({ color: seamColor, emissive: seamColor, emissiveIntensity: opts.night ? 3.2 : 1.6, roughness: 0.3 });
    const stopRed = new THREE.MeshStandardMaterial({ color: 0xd8231b, metalness: 0.1, roughness: 0.35 });

    const shell = new THREE.Mesh(shellGeometry(THREE, 64, 192), chrome);
    shell.castShadow = true;
    root.add(shell);

    const skirt = new THREE.Mesh(skirtGeometry(THREE, 192), graphite);
    skirt.castShadow = true;
    root.add(skirt);

    // Light seam: status light all the way round. Cyan = RTK fixed, amber = blade on, red = fault.
    const seam = new THREE.Mesh(new THREE.TubeGeometry(seamCurve(THREE, 0.935, DIM.seamY - 0.012), 320, 0.004, 8, true), seamMat);
    root.add(seam);

    // GNSS "eye": radio-transparent dark glass. A metallised chrome shell would block satellite signals,
    // so the antenna sits under this non-metallic window at the crown.
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.062, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), glass);
    eye.scale.set(1, 0.42, 1);
    eye.position.set(0.02, DIM.shellTop - 0.012, 0);
    root.add(eye);
    const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.063, 0.003, 8, 96), seamMat);
    eyeRing.rotation.x = Math.PI / 2;
    eyeRing.position.set(0.02, DIM.shellTop - 0.011, 0);
    root.add(eyeRing);

    // Stop button: required on a robot mower. Red, raised, and reachable without bending close to the blade.
    const stopBase = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.012, 48), graphite);
    stopBase.position.set(-0.115, DIM.shellTop - 0.03, 0);
    stopBase.rotation.z = 0.32;
    root.add(stopBase);
    const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.016, 48), stopRed);
    stop.position.set(-0.119, DIM.shellTop - 0.019, 0);
    stop.rotation.z = 0.32;
    root.add(stop);

    // Front camera: a flush dark-glass lens in the nose, ringed by the same light as the seam.
    const [nx] = outline(0, 1);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.03, 32, 16), glass);
    lens.scale.set(0.35, 0.55, 1.6);
    lens.position.set(nx - 0.035, DIM.seamY + 0.032, 0);
    root.add(lens);

    // Drive wheels, hidden under the shell lip: only a sliver of tyre shows below the skirt, so the body
    // seems to float. Graphite hubs with a thin light ring for the night look.
    [1, -1].forEach((side) => {
      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(DIM.wheelR, DIM.wheelR, 0.055, 48), rubber);
      tyre.rotation.x = Math.PI / 2;
      tyre.position.set(0, DIM.wheelR, side * DIM.track / 2);
      tyre.castShadow = true;
      root.add(tyre);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.058, 48), graphite);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(0, DIM.wheelR, side * DIM.track / 2);
      root.add(hub);
    });

    root.userData.seamMaterial = seamMat;
    root.userData.dimensions = DIM;
    return root;
  }

  // Procedural environment for reflections: sky gradient, a sun, soft "studio" panels and lawn below.
  function environment(THREE, renderer, mode) {
    const env = new THREE.Scene();
    const skyGeo = new THREE.SphereGeometry(50, 64, 32);
    const top = new THREE.Color(mode === "night" ? "#05070d" : "#5e9fe0");
    const horizon = new THREE.Color(mode === "night" ? "#141a2a" : "#c9dce8");
    const ground = new THREE.Color(mode === "night" ? "#06100a" : "#3f7a31");
    const colors = [];
    const p = skyGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 50;
      const c = y > 0 ? horizon.clone().lerp(top, Math.pow(y, 0.6)) : horizon.clone().lerp(ground, Math.min(1, -y * 6));
      colors.push(c.r, c.g, c.b);
    }
    skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    env.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const panel = (w, h, x, y, z, intensity) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    if (mode === "night") {
      panel(6, 1, 0, 8, 14, 0.6);
    } else {
      panel(10, 4, -12, 14, 8, 3.0);   // key softbox / sun
      panel(18, 2, 14, 6, -6, 1.2);    // long strip: the "liquid" highlight
      panel(6, 6, 0, 20, -14, 1.0);
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    return pmrem.fromScene(env, 0.02).texture;
  }

  // A lawn with mowing stripes, drawn on a canvas.
  function lawnTexture(THREE, night) {
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const g = c.getContext("2d");
    for (let i = 0; i < 8; i++) {
      g.fillStyle = night ? (i % 2 ? "#0e2410" : "#132d15") : (i % 2 ? "#5d9a43" : "#7ab35a");
      g.fillRect(i * 128, 0, 128, 1024);
    }
    let seed = 3;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 60000; i++) {
      const x = rand() * 1024, y = rand() * 1024, l = night ? 10 + rand() * 18 : 30 + rand() * 30;
      g.strokeStyle = `hsla(${95 + rand() * 25},55%,${l}%,0.5)`;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rand() - 0.5) * 2, y - 2 - rand() * 4); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 6);
    t.anisotropy = 8;
    t.encoding = THREE.sRGBEncoding;  // canvas colours are sRGB; without this the lawn renders washed out
    return t;
  }

  function buildScene(THREE, renderer, opts) {
    opts = opts || {};
    const night = opts.mode === "night";
    const studio = opts.mode === "studio";
    const scene = new THREE.Scene();
    scene.environment = environment(THREE, renderer, night ? "night" : "day");
    scene.background = new THREE.Color(studio ? (opts.studioBg || "#e9ece8") : night ? "#05070d" : "#cfe3f2");
    if (!studio) scene.fog = new THREE.Fog(scene.background, 6, 22);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      studio ? new THREE.ShadowMaterial({ opacity: 0.22 }) : new THREE.MeshStandardMaterial({ map: lawnTexture(THREE, night), roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const sun = new THREE.DirectionalLight(night ? 0x8899cc : 0xfff6e8, night ? 0.25 : 1.3);
    sun.position.set(-3, 6, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -1.5;
    sun.shadow.camera.right = sun.shadow.camera.top = 1.5;
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(night ? 0x223355 : 0xcfe2f5, night ? 0x050805 : 0x3d6630, night ? 0.15 : 0.35));

    const mower = buildMower(THREE, { night, seamColor: opts.seamColor });
    mower.position.x = -0.13;   // centre the shell on the origin
    scene.add(mower);
    if (night) {
      const glow = new THREE.PointLight(new THREE.Color(opts.seamColor || "#7fe3ff"), 1.4, 1.6);
      glow.position.set(0, 0.06, 0);
      scene.add(glow);
    }
    return { scene, mower };
  }

  global.FauerbotM1 = { buildMower, buildScene, DIM };
})(window);
