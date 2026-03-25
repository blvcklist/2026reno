import * as THREE from 'three';

(function () {
  const canvas = document.getElementById('cubeCanvas');
  if (!canvas) return;

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 3.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // --- Scene & Camera ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  // 해상도별 카메라 위치 계산
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

      // 사각형 영역 마스크 (소프트박스/창문 시뮬레이션)
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

        // 어두운 스튜디오 환경 (대비 극대화)
        vec3 dark = vec3(0.02, 0.03, 0.05);
        vec3 mid = vec3(0.04, 0.05, 0.08);
        vec3 col;
        if (y > 0.0) {
          col = mix(mid, dark, smoothstep(0.0, 0.8, y));
        } else {
          col = mix(mid, dark, smoothstep(0.0, -0.6, y));
        }

        // 메인 스트립 소프트박스 (상단, 매우 밝고 선명)
        float strip1 = rectLight(n, vec3(0.15, 1, 0.1), 0.5, 0.04);
        col += strip1 * vec3(1.0, 0.98, 0.96) * 14.0;
        float strip2 = rectLight(n, vec3(-0.25, 1, -0.15), 0.4, 0.035);
        col += strip2 * vec3(0.95, 0.97, 1.0) * 10.0;
        // 추가 상단 스트립
        float strip3 = rectLight(n, vec3(0.0, 1, -0.3), 0.3, 0.03);
        col += strip3 * vec3(0.9, 0.95, 1.0) * 8.0;

        // 우측 큰 소프트박스
        float sb1 = rectLight(n, vec3(1, 0.2, 0.2), 0.1, 0.7);
        col += sb1 * vec3(0.9, 0.93, 1.0) * 12.0;

        // 좌측 엣지 라이트 (시원한 블루, 강하게)
        float sb2 = rectLight(n, vec3(-1, 0.1, 0.15), 0.08, 0.55);
        col += sb2 * vec3(0.5, 0.75, 1.0) * 10.0;

        // 후방 소프트박스 (뒤에서 비추는 빛)
        float sb3 = rectLight(n, vec3(0, 0.3, -1), 0.3, 0.4);
        col += sb3 * vec3(1.0, 0.95, 0.9) * 10.0;

        // 하단 리플렉터
        float floorRef = rectLight(n, vec3(0, -1, 0.3), 0.8, 0.2);
        col += floorRef * vec3(0.2, 0.25, 0.35) * 5.0;

        // 날카로운 림 하이라이트 (여러 방향)
        float rim1 = pow(max(dot(n, normalize(vec3(0, 0.3, -1))), 0.0), 24.0);
        col += rim1 * vec3(1.0, 0.97, 0.93) * 10.0;
        float rim2 = pow(max(dot(n, normalize(vec3(1, 0.5, 0.5))), 0.0), 20.0);
        col += rim2 * vec3(1.0, 1.0, 0.95) * 6.0;

        // 프리즘 스펙트럼 (강렬한 무지개 반사)
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

  // --- Glass Material (어두운 배경용 크리스탈 유리) ---
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0.97, 0.98, 1.0),
    metalness: 0.05,
    roughness: 0.0,
    transmission: 0.92,
    thickness: 0.3,
    ior: 2.0,
    envMapIntensity: 8.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 1.0,
    specularIntensity: 4.0,
    specularColor: 0xffffff,
    sheen: 0.4,
    sheenRoughness: 0.03,
    sheenColor: 0x99bbff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    attenuationColor: new THREE.Color(0.85, 0.92, 1.0),
    attenuationDistance: 3.0,
    dispersion: 0.3,
    iridescence: 0.7,
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [80, 500],
    emissive: new THREE.Color(0x112244),
    emissiveIntensity: 0.15,
  });

  // --- Edge Material (강하게 빛나는 크롬) ---
  const edgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.0,
    envMapIntensity: 10.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 1.0,
    specularIntensity: 3.0,
    specularColor: 0xffffff,
    emissive: 0x88aadd,
    emissiveIntensity: 1.2,
    sheen: 0.5,
    sheenRoughness: 0.0,
    sheenColor: 0xaaccff,
  });

  // --- Build a glass cube with edges ---
  function createGlassCube(size) {
    const group = new THREE.Group();

    // Glass body
    const boxGeo = new THREE.BoxGeometry(size, size, size);
    group.add(new THREE.Mesh(boxGeo, glassMaterial));

    // Edges
    const r = size * 0.008;
    const half = size / 2;
    const cylGeo = new THREE.CylinderGeometry(r, r, size, 6);

    const edgeDefs = [
      // bottom
      { p: [0, -half, -half], r: [0, 0, Math.PI / 2] },
      { p: [0, -half, half], r: [0, 0, Math.PI / 2] },
      { p: [-half, -half, 0], r: [Math.PI / 2, 0, 0] },
      { p: [half, -half, 0], r: [Math.PI / 2, 0, 0] },
      // top
      { p: [0, half, -half], r: [0, 0, Math.PI / 2] },
      { p: [0, half, half], r: [0, 0, Math.PI / 2] },
      { p: [-half, half, 0], r: [Math.PI / 2, 0, 0] },
      { p: [half, half, 0], r: [Math.PI / 2, 0, 0] },
      // vertical
      { p: [-half, 0, -half], r: [0, 0, 0] },
      { p: [half, 0, -half], r: [0, 0, 0] },
      { p: [-half, 0, half], r: [0, 0, 0] },
      { p: [half, 0, half], r: [0, 0, 0] },
    ];

    edgeDefs.forEach(({ p, r: rot }) => {
      const m = new THREE.Mesh(cylGeo, edgeMaterial);
      m.position.set(...p);
      m.rotation.set(...rot);
      group.add(m);
    });

    return group;
  }

  // --- Cube cluster (3x3x3 grid → one big cube shape) ---
  const cubeGroup = new THREE.Group();
  scene.add(cubeGroup);

  const unitSize = 0.75;
  const gap = 0.1;
  const step = unitSize + gap;

  // Each cube stores its target position + a random scatter origin
  const cubes = [];

  // scatter 반경을 화면 크기에 비례하게 계산
  function getScatterRadius() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const diag = Math.sqrt(w * w + h * h);
    return Math.max(10, diag / 100);
  }
  const SCATTER_RADIUS = getScatterRadius();

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const dist = Math.abs(x) + Math.abs(y) + Math.abs(z);
        if (dist === 0) continue;

        const cube = createGlassCube(unitSize);

        // Random scattered start position (scaled to viewport)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = SCATTER_RADIUS + Math.random() * (SCATTER_RADIUS * 0.4);
        const startX = r * Math.sin(phi) * Math.cos(theta);
        const startY = r * Math.sin(phi) * Math.sin(theta);
        const startZ = r * Math.cos(phi);

        // Random initial rotation
        const startRot = {
          x: Math.random() * Math.PI * 2,
          y: Math.random() * Math.PI * 2,
          z: Math.random() * Math.PI * 2,
        };

        cube.position.set(startX, startY, startZ);
        cube.rotation.set(startRot.x, startRot.y, startRot.z);

        // Stagger delay per cube (outer cubes arrive slightly later)
        const delay = Math.sqrt(x * x + y * y + z * z) * 0.3 + Math.random() * 0.4;

        cubes.push({
          mesh: cube,
          target: { x: x * step, y: y * step, z: z * step },
          start: { x: startX, y: startY, z: startZ },
          startRot,
          delay,
        });

        cubeGroup.add(cube);
      }
    }
  }

  // Diamond tilt (45° rotation to match Figma)
  cubeGroup.rotation.x = Math.PI / 5;
  cubeGroup.rotation.z = Math.PI / 4;

  // --- Lights (어두운 스튜디오 세팅 — 하이 콘트라스트) ---
  // 앰비언트: 극히 낮게
  scene.add(new THREE.AmbientLight(0xc8deff, 0.15));

  // 키 라이트 (강한 메인 조명)
  const keyLight = new THREE.DirectionalLight(0xffffff, 6.0);
  keyLight.position.set(5, 8, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  scene.add(keyLight);

  // 필 라이트 (시원한 블루 톤, 약하게)
  const fillLight = new THREE.DirectionalLight(0x80b0ff, 0.6);
  fillLight.position.set(-6, -2, 4);
  scene.add(fillLight);

  // 림 라이트 (후방, 강한 실루엣)
  const rimLight = new THREE.DirectionalLight(0xfff0e0, 4.0);
  rimLight.position.set(0, 3, -8);
  scene.add(rimLight);

  // 컬러 악센트 조명 (회전하며 반사, 더 강하게)
  const p1 = new THREE.PointLight(0xff6688, 6, 30);
  p1.position.set(4, 2, 5);
  scene.add(p1);

  const p2 = new THREE.PointLight(0x6688ff, 6, 30);
  p2.position.set(-4, -2, 5);
  scene.add(p2);

  // 스팟라이트 (큐브 표면 하이라이트, 더 강하게)
  const spotLight = new THREE.SpotLight(0xffffff, 12, 35, Math.PI / 6, 0.4, 1);
  spotLight.position.set(5, 5, 8);
  scene.add(spotLight);
  scene.add(spotLight.target);

  // --- Resize ---
  function resize() {
    const hero = canvas.parentElement;
    const w = hero.clientWidth;
    const h = hero.clientHeight;
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

  // 모바일 터치 지원
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

  // --- 자유 이동 (조립 후 화면 내 떠다니기) ---
  const drift = { x: 0, y: 0 };
  const driftVel = { x: 0.3 + Math.random() * 0.2, y: 0.2 + Math.random() * 0.15 };
  // 화면 내 이동 범위 (카메라 거리에 비례)
  function getDriftBounds() {
    const z = getCameraZ();
    const fovRad = (35 / 2) * Math.PI / 180;
    const halfH = Math.tan(fovRad) * z * 0.45;
    const aspect = window.innerWidth / window.innerHeight;
    const halfW = halfH * aspect * 0.45;
    return { maxX: halfW, maxY: halfH };
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animate(time) {
    requestAnimationFrame(animate);

    if (startTime < 0) startTime = time;
    const elapsed = (time - startTime) * 0.001;

    // --- Assembly phase ---
    cubes.forEach(({ mesh, target, start, startRot, delay }, idx) => {
      const cubeTime = Math.max(0, elapsed - delay);
      const progress = Math.min(1, cubeTime / ASSEMBLE_DURATION);
      const ease = easeOutCubic(progress);

      // 기본 조립 위치
      let px = start.x + (target.x - start.x) * ease;
      let py = start.y + (target.y - start.y) * ease;
      let pz = start.z + (target.z - start.z) * ease;

      // 조립 완료 후 target 위치 유지
      if (progress >= 1) {
        px = target.x;
        py = target.y;
        pz = target.z;
      }

      mesh.position.x = px;
      mesh.position.y = py;
      mesh.position.z = pz;

      mesh.rotation.x = startRot.x * (1 - ease);
      mesh.rotation.y = startRot.y * (1 - ease);
      mesh.rotation.z = startRot.z * (1 - ease);
    });

    // --- 자유 이동 (부드럽게 떠다니기, 페이드인) ---
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

    // --- 조명 회전 (자연스러운 반사 이동) ---
    const orbitSpeed = 0.2;
    const orbitR = 7;
    p1.position.x = Math.sin(elapsed * orbitSpeed) * orbitR;
    p1.position.y = 2 + Math.sin(elapsed * 0.15) * 2;
    p1.position.z = Math.cos(elapsed * orbitSpeed) * orbitR;

    p2.position.x = Math.sin(elapsed * orbitSpeed * 0.6 + Math.PI) * orbitR;
    p2.position.y = -1 + Math.cos(elapsed * 0.12) * 2;
    p2.position.z = Math.cos(elapsed * orbitSpeed * 0.6 + Math.PI) * orbitR;

    // 스팟라이트가 천천히 이동
    spotLight.position.x = Math.sin(elapsed * 0.12) * 6;
    spotLight.position.y = 4 + Math.cos(elapsed * 0.1) * 3;
    spotLight.position.z = 6 + Math.sin(elapsed * 0.08) * 2;
    spotLight.target.position.set(drift.x, drift.y, 0);

    // --- Smooth mouse tracking ---
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
