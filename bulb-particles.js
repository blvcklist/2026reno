// ===== Morphing Particles (Hero Slide 02) =====
// 얼굴 ↔ 전구 형태를 번갈아 모프하는 파티클 효과
document.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('bulbCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, DPR;

  function resize() {
    var parent = canvas.parentElement;
    W = parent.offsetWidth || window.innerWidth;
    H = parent.offsetHeight || window.innerHeight;
    DPR = Math.min(devicePixelRatio, 2);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ── 전구 형태 그리기 ──
  function drawBulbShape(size) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var g = c.getContext('2d');
    var cx = size / 2, cy = size * 0.38, bulbR = size * 0.28;

    g.beginPath(); g.arc(cx, cy, bulbR, 0, Math.PI * 2);
    g.fillStyle = '#fff'; g.fill();

    var neckTop = cy + bulbR * 0.85, neckBot = cy + bulbR * 1.45;
    var neckW1 = bulbR * 0.55, neckW2 = bulbR * 0.4;
    g.beginPath();
    g.moveTo(cx - neckW1, neckTop); g.lineTo(cx - neckW2, neckBot);
    g.lineTo(cx + neckW2, neckBot); g.lineTo(cx + neckW1, neckTop);
    g.closePath(); g.fillStyle = '#fff'; g.fill();

    var sockTop = neckBot, sockH = bulbR * 0.35, sockW = neckW2 * 0.9;
    g.fillStyle = '#fff';
    g.fillRect(cx - sockW, sockTop, sockW * 2, sockH);
    g.fillStyle = '#000';
    for (var s = 0; s < 3; s++)
      g.fillRect(cx - sockW, sockTop + sockH * 0.2 + s * sockH * 0.25, sockW * 2, sockH * 0.08);

    var tipTop = sockTop + sockH, tipH = bulbR * 0.15;
    g.beginPath();
    g.moveTo(cx - sockW * 0.7, tipTop); g.lineTo(cx - sockW * 0.3, tipTop + tipH);
    g.lineTo(cx + sockW * 0.3, tipTop + tipH); g.lineTo(cx + sockW * 0.7, tipTop);
    g.closePath(); g.fillStyle = '#fff'; g.fill();

    g.strokeStyle = '#fff'; g.lineWidth = size * 0.008;
    g.beginPath();
    g.moveTo(cx - bulbR * 0.15, cy + bulbR * 0.5);
    g.quadraticCurveTo(cx - bulbR * 0.3, cy - bulbR * 0.2, cx, cy - bulbR * 0.4);
    g.quadraticCurveTo(cx + bulbR * 0.3, cy - bulbR * 0.2, cx + bulbR * 0.15, cy + bulbR * 0.5);
    g.stroke();

    return g.getImageData(0, 0, size, size);
  }

  // ── 물음표 (?) 실루엣 ──
  function drawFaceShape(size) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var g = c.getContext('2d');
    var cx = size / 2;
    var s = size / 512;

    // 큰 폰트로 ? 를 직접 렌더링
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold ' + Math.round(420 * s) + 'px Pretendard, Arial, sans-serif';
    g.fillText('?', cx, size * 0.47);

    return g.getImageData(0, 0, size, size);
  }

  // ── 이미지에서 위치 샘플링 ──
  function samplePositions(imageData, count, offX, offY, scale) {
    var data = imageData.data, w = imageData.width, h = imageData.height;
    var whites = [];
    for (var y = 0; y < h; y += 2) {
      for (var x = 0; x < w; x += 2) {
        var idx = (y * w + x) * 4;
        if (data[idx] > 200 && data[idx + 3] > 128) {
          whites.push({ x: x * scale + offX, y: y * scale + offY });
        }
      }
    }
    var result = [];
    for (var i = 0; i < count; i++) {
      var p = whites[Math.floor(Math.random() * whites.length)];
      result.push({
        x: p.x + (Math.random() - 0.5) * 2 * scale,
        y: p.y + (Math.random() - 0.5) * 2 * scale
      });
    }
    return result;
  }

  // ── 파티클 설정 ──
  var SHAPE_COUNT = 6000;
  var BG_COUNT = 800;
  var TOTAL = SHAPE_COUNT + BG_COUNT;
  var particles = [];
  var morphStartTime = 0;
  var MORPH_DURATION = 2500;   // 모프 전환 시간
  var HOLD_DURATION = 4000;    // 형태 유지 시간
  var CYCLE_DURATION = MORPH_DURATION + HOLD_DURATION; // 한 형태의 총 주기
  var currentShape = 0;        // 0: face, 1: bulb
  var shapePositions = [[], []]; // [face positions, bulb positions]
  var initialized = false;

  function computeShapePositions() {
    var shapeSize = 512;
    var displaySize = Math.min(W, H) * 0.65;
    var scale = displaySize / shapeSize;
    var offX = W * 0.65 - displaySize / 2;
    var offY = H / 2 - displaySize * 0.4;

    var faceData = drawFaceShape(shapeSize);
    var bulbData = drawBulbShape(shapeSize);

    shapePositions[0] = samplePositions(faceData, SHAPE_COUNT, offX, offY, scale);
    shapePositions[1] = samplePositions(bulbData, SHAPE_COUNT, offX, offY, scale);
  }

  function initParticles() {
    computeShapePositions();
    particles = [];

    // 형태 파티클
    for (var i = 0; i < SHAPE_COUNT; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 200 + Math.random() * 400;
      var home = shapePositions[0][i]; // face로 시작
      particles.push({
        x: home.x + Math.cos(angle) * dist,
        y: home.y + Math.sin(angle) * dist,
        homeX: home.x,
        homeY: home.y,
        nextX: home.x,
        nextY: home.y,
        vx: 0, vy: 0,
        size: 0.4 + Math.random() * 1.0,
        alpha: 0,
        isShape: true,
        hue: 45,
        sat: 80,
        light: 60 + Math.random() * 30,
      });
    }

    // 배경 파티클
    for (var j = 0; j < BG_COUNT; j++) {
      var bx = Math.random() * W, by = Math.random() * H;
      particles.push({
        x: bx, y: by,
        homeX: bx, homeY: by,
        nextX: bx, nextY: by,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 0.3 + Math.random() * 0.8,
        alpha: 0.05 + Math.random() * 0.15,
        isShape: false,
        hue: 45, sat: 30,
        light: 70 + Math.random() * 20,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    currentShape = 0;
    morphStartTime = performance.now();
    initialized = true;
  }

  // 다음 형태로 모프 시작
  function triggerMorph() {
    var nextShape = (currentShape + 1) % 2;
    var nextPos = shapePositions[nextShape];
    for (var i = 0; i < SHAPE_COUNT; i++) {
      particles[i].homeX = particles[i].nextX; // 현재 위치를 home으로
      particles[i].homeY = particles[i].nextY;
      particles[i].nextX = nextPos[i].x;
      particles[i].nextY = nextPos[i].y;
    }
    currentShape = nextShape;
    morphStartTime = performance.now();
  }

  function update() {
    var now = performance.now();
    var elapsed = now - morphStartTime;
    var morphT = Math.min(elapsed / MORPH_DURATION, 1);
    var morphEase = morphT * morphT * (3 - 2 * morphT); // smoothstep
    var time = now * 0.001;

    // 형태 유지 시간 지나면 다음 모프
    if (elapsed > CYCLE_DURATION && initialized) {
      triggerMorph();
      return;
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      if (p.isShape) {
        // 모프 중: home → next 보간
        var targetX = p.homeX + (p.nextX - p.homeX) * morphEase;
        var targetY = p.homeY + (p.nextY - p.homeY) * morphEase;

        var dx = targetX - p.x;
        var dy = targetY - p.y;
        p.vx += dx * 0.004;
        p.vy += dy * 0.004;
        p.vx *= 0.93;
        p.vy *= 0.93;
        p.x += p.vx;
        p.y += p.vy;

        // 미세한 흔들림
        if (morphT >= 1) {
          p.x += Math.sin(time * 1.5 + i * 0.1) * 0.25;
          p.y += Math.cos(time * 1.2 + i * 0.15) * 0.25;
        }

        // alpha
        var targetAlpha = 0.3 + morphEase * 0.5;
        p.alpha += (targetAlpha - p.alpha) * 0.05;

        // 모프 완료 후 글로우
        if (morphT >= 1) {
          var distToTarget = Math.sqrt(dx * dx + dy * dy);
          if (distToTarget < 3) {
            p.alpha = 0.5 + Math.sin(time * 2 + i * 0.05) * 0.15;
          }
        }
      } else {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        p.alpha = 0.05 + Math.sin(time * p.twinkleSpeed + p.twinkleOffset) * 0.1;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.alpha <= 0.01) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + p.hue + ',' + p.sat + '%,' + p.light + '%,' + p.alpha + ')';
      ctx.fill();
    }

    // 글로우 오라
    var elapsed = performance.now() - morphStartTime;
    var morphT = Math.min(elapsed / MORPH_DURATION, 1);
    if (morphT > 0.85) {
      var glowAlpha = (morphT - 0.85) / 0.15 * 0.1;
      var displaySize = Math.min(W, H) * 0.65;
      var glowX = W * 0.65;
      var glowY = H / 2 - displaySize * 0.03;
      var glowR = displaySize * 0.35;
      var gradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
      gradient.addColorStop(0, 'hsla(45, 100%, 85%, ' + glowAlpha + ')');
      gradient.addColorStop(0.5, 'hsla(45, 80%, 70%, ' + (glowAlpha * 0.4) + ')');
      gradient.addColorStop(1, 'hsla(45, 60%, 60%, 0)');
      ctx.beginPath();
      ctx.arc(glowX, glowY, glowR, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!initialized) return;
    update();
    draw();
  }

  // scatter: 슬라이드 진입 시
  function scatterAndStart() {
    if (!initialized) {
      resize();
      initParticles();
    } else {
      computeShapePositions();
      currentShape = 0;
      for (var i = 0; i < SHAPE_COUNT; i++) {
        var p = particles[i];
        var angle = Math.random() * Math.PI * 2;
        var dist = 200 + Math.random() * 400;
        p.x = shapePositions[0][i].x + Math.cos(angle) * dist;
        p.y = shapePositions[0][i].y + Math.sin(angle) * dist;
        p.vx = 0; p.vy = 0; p.alpha = 0;
        p.homeX = p.x; p.homeY = p.y;
        p.nextX = shapePositions[0][i].x;
        p.nextY = shapePositions[0][i].y;
      }
      morphStartTime = performance.now();
    }
  }

  resize();
  window.addEventListener('resize', function () {
    resize();
    if (initialized) { computeShapePositions(); }
  });

  // 슬라이드 전환 감지
  window.addEventListener('heroSlideChange', function () {
    var slide = document.querySelector('.hero-slide[data-slide="1"]');
    if (slide && slide.classList.contains('active')) {
      scatterAndStart();
    }
  });

  animate();
});
