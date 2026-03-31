import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

(function () {
  const canvas = document.getElementById('cubeCanvas');
  if (!canvas) return;

  // --- Renderer (성능 최적화) ---
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.4;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  Object.defineProperty(renderer, 'transmissionResolutionScale', { value: 1.0 });

  // --- Scene & Camera ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  function getCameraZ() {
    const w = window.innerWidth;
    if (w <= 768) return 18;
    if (w <= 1024) return 16;
    return 14;
  }
  camera.position.set(-3, -0.5, getCameraZ());

  // --- Environment map (procedural) ---
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envGeo = new THREE.SphereGeometry(10, 64, 32);
  const envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;

      float rectLight(vec3 n, vec3 center, float sizeX, float sizeY) {
        vec3 c = normalize(center);
        vec3 right = normalize(cross(c, vec3(0,1,0)));
        vec3 up = normalize(cross(right, c));
        float dx = dot(n - c, right);
        float dy = dot(n - c, up);
        float mx = smoothstep(sizeX, sizeX * 0.2, abs(dx));
        float my = smoothstep(sizeY, sizeY * 0.2, abs(dy));
        return mx * my;
      }

      void main() {
        vec3 n = normalize(vPos);
        float y = n.y;

        vec3 dark = vec3(0.02, 0.03, 0.05);
        vec3 mid = vec3(0.04, 0.05, 0.08);
        vec3 col;
        if (y > 0.0) {
          col = mix(mid, dark, smoothstep(0.0, 0.8, y));
        } else {
          col = mix(mid, dark, smoothstep(0.0, -0.6, y));
        }

        float strip1 = rectLight(n, vec3(0.15, 1, 0.1), 0.5, 0.04);
        col += strip1 * vec3(1.0, 0.98, 0.96) * 14.0;
        float strip2 = rectLight(n, vec3(-0.25, 1, -0.15), 0.4, 0.035);
        col += strip2 * vec3(0.95, 0.97, 1.0) * 10.0;
        float strip3 = rectLight(n, vec3(0.0, 1, -0.3), 0.3, 0.03);
        col += strip3 * vec3(0.9, 0.95, 1.0) * 8.0;

        float sb1 = rectLight(n, vec3(1, 0.2, 0.2), 0.1, 0.7);
        col += sb1 * vec3(0.9, 0.93, 1.0) * 12.0;

        float sb2 = rectLight(n, vec3(-1, 0.1, 0.15), 0.08, 0.55);
        col += sb2 * vec3(0.5, 0.75, 1.0) * 10.0;

        float sb3 = rectLight(n, vec3(0, 0.3, -1), 0.3, 0.4);
        col += sb3 * vec3(1.0, 0.95, 0.9) * 10.0;

        float floorRef = rectLight(n, vec3(0, -1, 0.3), 0.8, 0.2);
        col += floorRef * vec3(0.2, 0.25, 0.35) * 5.0;

        float rim1 = pow(max(dot(n, normalize(vec3(0, 0.3, -1))), 0.0), 24.0);
        col += rim1 * vec3(1.0, 0.97, 0.93) * 10.0;
        float rim2 = pow(max(dot(n, normalize(vec3(1, 0.5, 0.5))), 0.0), 20.0);
        col += rim2 * vec3(1.0, 1.0, 0.95) * 6.0;

        float r1 = pow(max(dot(n, normalize(vec3(3,1,2))), 0.0), 28.0);
        float r2 = pow(max(dot(n, normalize(vec3(-2,2,3))), 0.0), 28.0);
        float r3 = pow(max(dot(n, normalize(vec3(1,-2,3))), 0.0), 32.0);
        float r4 = pow(max(dot(n, normalize(vec3(-1,3,-2))), 0.0), 36.0);
        col += r1 * vec3(1.0, 0.3, 0.15) * 5.0;
        col += r2 * vec3(0.15, 0.4, 1.0) * 5.0;
        col += r3 * vec3(0.2, 1.0, 0.5) * 4.0;
        col += r4 * vec3(0.8, 0.2, 1.0) * 3.5;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  envScene.add(new THREE.Mesh(envGeo, envMat));
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envMap;
  pmrem.dispose();

  // --- Glass Material ---
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.9, 0.92, 0.97),
    metalness: 0.05,
    roughness: 0.0,
    transmission: 0.92,
    thickness: 0.6,
    ior: 2.2,
    envMapIntensity: 8.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 1.0,
    specularIntensity: 5.0,
    specularColor: 0xffffff,
    sheen: 0.3,
    sheenRoughness: 0.01,
    sheenColor: 0x8899cc,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    side: THREE.DoubleSide,
    attenuationColor: new THREE.Color(0.6, 0.7, 0.85),
    attenuationDistance: 1.0,
    dispersion: 2.0,
    iridescence: 0.9,
    iridescenceIOR: 2.2,
    iridescenceThicknessRange: [100, 800],
    emissive: new THREE.Color(0x0a1830),
    emissiveIntensity: 0.1,
  });

  // --- Cube data (26개: 3x3x3 - center) ---
  const unitSize = 0.75;
  const gap = 0.1;
  const step = unitSize + gap;
  const cubeData = [];

  function getScatterRadius() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return Math.max(10, Math.sqrt(w * w + h * h) / 100);
  }
  const SCATTER_RADIUS = getScatterRadius();

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (Math.abs(x) + Math.abs(y) + Math.abs(z) === 0) continue;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = SCATTER_RADIUS + Math.random() * (SCATTER_RADIUS * 0.4);

        cubeData.push({
          target: new THREE.Vector3(x * step, y * step, z * step),
          start: new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          ),
          startRot: new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ),
          delay: Math.sqrt(x * x + y * y + z * z) * 0.3 + Math.random() * 0.4,
        });
      }
    }
  }

  const COUNT = cubeData.length; // 26

  // --- InstancedMesh: Glass bodies (1 draw call) ---
  const boxGeo = new RoundedBoxGeometry(unitSize, unitSize, unitSize, 6, unitSize * 0.12);
  const glassInstanced = new THREE.InstancedMesh(boxGeo, glassMaterial, COUNT);
  glassInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const cubeGroup = new THREE.Group();
  cubeGroup.add(glassInstanced);
  scene.add(cubeGroup);

  cubeGroup.rotation.x = Math.PI / 5;
  cubeGroup.rotation.z = Math.PI / 4;

  // --- Lights ---
  scene.add(new THREE.AmbientLight(0xc8deff, 0.15));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x80b0ff, 0.6);
  fillLight.position.set(-6, -2, 4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xfff0e0, 0.8);
  rimLight.position.set(0, 3, -8);
  scene.add(rimLight);

  const p1 = new THREE.PointLight(0xff4466, 4, 25);
  p1.position.set(4, 2, 5);
  scene.add(p1);

  const p2 = new THREE.PointLight(0x4488ff, 4, 25);
  p2.position.set(-4, -2, 5);
  scene.add(p2);

  const spotLight = new THREE.SpotLight(0xffffff, 4, 35, Math.PI / 6, 0.5, 1);
  spotLight.position.set(5, 5, 8);
  scene.add(spotLight);
  scene.add(spotLight.target);

  // --- Resize ---
  function resize() {
    const hero = canvas.parentElement;
    const w = hero.clientWidth || window.innerWidth;
    const h = hero.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.position.z = getCameraZ();
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Mouse interaction ---
  const mouse = { x: 0, y: 0 };
  const mouseSmooth = { x: 0, y: 0 };
  const MOUSE_INFLUENCE = 0.6;
  const MOUSE_LERP = 0.25;

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  // --- Animation ---
  const ASSEMBLE_DURATION = 4.5;
  let startTime = -1;
  const BASE_ROT_X = Math.PI / 5;
  const BASE_ROT_Z = Math.PI / 4;
  const IDLE_ROT_SPEED = 0.6;

  const drift = { x: 0, y: 0 };
  const driftVel = { x: 0.3 + Math.random() * 0.2, y: 0.2 + Math.random() * 0.15 };

  function getDriftBounds() {
    const z = getCameraZ();
    const fovRad = (35 / 2) * Math.PI / 180;
    const halfH = Math.tan(fovRad) * z * 0.8;
    const aspect = window.innerWidth / window.innerHeight;
    return { maxX: halfH * aspect * 0.8, maxY: halfH };
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // 재사용 임시 객체
  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpScale = new THREE.Vector3(1, 1, 1);
  const tmpMatrix = new THREE.Matrix4();
  const tmpEuler = new THREE.Euler();

  function animate(time) {
    requestAnimationFrame(animate);

    if (startTime < 0) {
      startTime = time;
    }
    const elapsed = (time - startTime) * 0.001;

    // --- 각 큐브 인스턴스 업데이트 ---
    for (let i = 0; i < COUNT; i++) {
      const d = cubeData[i];
      const cubeTime = Math.max(0, elapsed - d.delay);
      const progress = Math.min(1, cubeTime / ASSEMBLE_DURATION);
      const ease = easeOutCubic(progress);

      // 위치 보간
      if (progress >= 1) {
        tmpPos.copy(d.target);
      } else {
        tmpPos.lerpVectors(d.start, d.target, ease);
      }

      // 회전 보간
      if (progress >= 1) {
        tmpEuler.set(0, 0, 0);
      } else {
        tmpEuler.set(
          d.startRot.x * (1 - ease),
          d.startRot.y * (1 - ease),
          d.startRot.z * (1 - ease)
        );
      }
      tmpQuat.setFromEuler(tmpEuler);

      // Glass body matrix
      tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
      glassInstanced.setMatrixAt(i, tmpMatrix);
    }
    glassInstanced.instanceMatrix.needsUpdate = true;

    // --- 자유 이동 ---
    const bounds = getDriftBounds();
    const driftStart = ASSEMBLE_DURATION + 1;
    const DRIFT_FADE = 2.0;
    if (elapsed > driftStart) {
      const driftT = elapsed - driftStart;
      const driftBlend = Math.min(1, driftT / DRIFT_FADE);
      const driftEase = driftBlend * driftBlend * (3 - 2 * driftBlend);
      drift.x = Math.sin(driftT * driftVel.x) * Math.cos(driftT * driftVel.x * 0.7) * bounds.maxX * driftEase;
      drift.y = Math.sin(driftT * driftVel.y) * Math.cos(driftT * driftVel.y * 0.6 + 1.0) * bounds.maxY * driftEase;
    }

    // --- 조명 회전 ---
    const orbitSpeed = 0.2;
    const orbitR = 7;
    p1.position.x = Math.sin(elapsed * orbitSpeed) * orbitR;
    p1.position.y = 2 + Math.sin(elapsed * 0.15) * 2;
    p1.position.z = Math.cos(elapsed * orbitSpeed) * orbitR;
    p2.position.x = Math.sin(elapsed * orbitSpeed * 0.6 + Math.PI) * orbitR;
    p2.position.y = -1 + Math.cos(elapsed * 0.12) * 2;
    p2.position.z = Math.cos(elapsed * orbitSpeed * 0.6 + Math.PI) * orbitR;
    spotLight.position.x = Math.sin(elapsed * 0.12) * 6;
    spotLight.position.y = 4 + Math.cos(elapsed * 0.1) * 3;
    spotLight.position.z = 6 + Math.sin(elapsed * 0.08) * 2;
    spotLight.target.position.set(drift.x, drift.y, 0);

    // --- Mouse tracking ---
    mouseSmooth.x += (mouse.x - mouseSmooth.x) * MOUSE_LERP;
    mouseSmooth.y += (mouse.y - mouseSmooth.y) * MOUSE_LERP;

    // --- Group rotation + drift ---
    const autoRotY = elapsed * IDLE_ROT_SPEED;
    const autoRotX = BASE_ROT_X + elapsed * 0.15 + Math.sin(elapsed * 0.3) * 0.3;
    const floatY = Math.sin(elapsed * 0.3) * 0.15;

    const idleStart = ASSEMBLE_DURATION + 0.5;
    const blendIn = Math.min(1, Math.max(0, (elapsed - idleStart) / 1.5));
    const blendEase = blendIn * blendIn * (3 - 2 * blendIn);

    cubeGroup.rotation.y = autoRotY + mouseSmooth.x * MOUSE_INFLUENCE * blendEase;
    cubeGroup.rotation.x = autoRotX + mouseSmooth.y * MOUSE_INFLUENCE * blendEase;
    cubeGroup.rotation.z = BASE_ROT_Z + Math.sin(elapsed * 0.2) * 0.3;
    cubeGroup.position.x = drift.x * blendEase;
    cubeGroup.position.y = (floatY + drift.y) * blendEase;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
