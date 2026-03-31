// ===== Particle Background for Hero Slide 03 =====
// anti-gravity.html 파티클 시스템을 hero slide 배경으로 적용
document.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return;

  var W, H;
  var mouse = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0 };
  var DPR = Math.min(devicePixelRatio, 2);

  function resize() {
    var parent = canvas.parentElement;
    W = parent.offsetWidth || window.innerWidth;
    H = parent.offsetHeight || window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }
  resize();

  document.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.vx = mouse.x - mouse.px;
    mouse.vy = mouse.y - mouse.py;
  });

  // ── Logo shape ──
  function drawLogoShape(size) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    var cx = size / 2, cy = size * 0.46;
    var outerR = size * 0.44, innerR = size * 0.30;

    ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = '#D03137'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#000000'; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - innerR * 0.5, cy + innerR * 0.75);
    ctx.lineTo(cx - outerR * 0.55, cy + outerR * 0.95);
    ctx.lineTo(cx + innerR * 0.1, cy + innerR * 0.85);
    ctx.closePath(); ctx.fillStyle = '#000000'; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - innerR * 0.65, cy + innerR * 0.7);
    ctx.lineTo(cx - outerR * 0.7, cy + outerR * 1.05);
    ctx.lineTo(cx - outerR * 0.55, cy + outerR * 0.95);
    ctx.lineTo(cx - innerR * 0.5, cy + innerR * 0.75);
    ctx.closePath(); ctx.fillStyle = '#D03137'; ctx.fill();

    ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#000000'; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - innerR * 0.45, cy + innerR * 0.8);
    ctx.lineTo(cx - outerR * 0.5, cy + outerR * 0.88);
    ctx.lineTo(cx + innerR * 0.05, cy + innerR * 0.9);
    ctx.closePath(); ctx.fillStyle = '#000000'; ctx.fill();

    var barW = size * 0.06, barH = size * 0.18;
    ctx.beginPath(); ctx.roundRect(cx - barW / 2, cy - barH * 0.8, barW, barH, barW * 0.3);
    ctx.fillStyle = '#D03137'; ctx.fill();

    ctx.beginPath(); ctx.arc(cx, cy + innerR * 0.45, size * 0.035, 0, Math.PI * 2);
    ctx.fillStyle = '#D03137'; ctx.fill();

    return ctx.getImageData(0, 0, size, size);
  }

  function sampleLogoPositions(imageData, count, logoSize, offX, offY, scale) {
    var data = imageData.data, width = imageData.width, height = imageData.height;
    var reds = [];
    for (var y = 0; y < height; y += 2) {
      for (var x = 0; x < width; x += 2) {
        var idx = (y * width + x) * 4;
        if (data[idx] > 150 && data[idx + 1] < 80 && data[idx + 2] < 80 && data[idx + 3] > 128) {
          reds.push({ x: x * scale + offX, y: y * scale + offY });
        }
      }
    }
    var result = [];
    for (var i = 0; i < count; i++) {
      var p = reds[Math.floor(Math.random() * reds.length)];
      result.push({ x: p.x + (Math.random() - 0.5) * 3 * scale, y: p.y + (Math.random() - 0.5) * 3 * scale });
    }
    return result;
  }

  // ── Config ──
  var LOGO_COUNT = 5000, BG_COUNT = 2000, TOTAL = LOGO_COUNT + BG_COUNT;
  var CONFIG = {
    mouseForce: 250, cursorSize: 100, friction: 0.94,
    noiseScale: 0.003, noiseSpeed: 0.0008,
    returnForce: 0.008, bgReturnForce: 0.001,
    logoParticleSize: 4.0, bgParticleSize: 2.5,
  };

  // Noise
  var PERM = new Uint8Array(512);
  for (var i = 0; i < 256; i++) PERM[i] = i;
  for (var i = 255; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = PERM[i]; PERM[i] = PERM[j]; PERM[j] = t; }
  for (var i = 0; i < 256; i++) PERM[i + 256] = PERM[i];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(hash, x, y) { var h = hash & 3; return ((h & 1) ? -(h < 2 ? x : y) : (h < 2 ? x : y)) + ((h & 2) ? -(h < 2 ? y : x) : (h < 2 ? y : x)); }
  function noise2D(x, y) {
    var xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
    var xf = x - Math.floor(x), yf = y - Math.floor(y);
    var u = fade(xf), v = fade(yf);
    var aa = PERM[PERM[xi] + yi], ab = PERM[PERM[xi] + yi + 1];
    var ba = PERM[PERM[xi + 1] + yi], bb = PERM[PERM[xi + 1] + yi + 1];
    return lerp(lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u), lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u), v);
  }

  var positions, velocities, homePositions, colors, sizes, isLogo, alphas;
  var logoCenterX, logoCenterY, logoOuterRadius;

  function initParticles() {
    var logoSize = 256, displaySize = Math.min(W, H) * 0.85;
    var scale = displaySize / logoSize;
    var offX = W / 2 - displaySize / 2, offY = H / 2 - displaySize * 0.46;
    logoCenterX = offX + (logoSize / 2) * scale;
    logoCenterY = offY + (logoSize * 0.46) * scale;
    logoOuterRadius = logoSize * 0.44 * scale;

    var imgData = drawLogoShape(logoSize);
    var logoPos = sampleLogoPositions(imgData, LOGO_COUNT, logoSize, offX, offY, scale);

    positions = new Float32Array(TOTAL * 2);
    velocities = new Float32Array(TOTAL * 2);
    homePositions = new Float32Array(TOTAL * 2);
    colors = new Float32Array(TOTAL * 3);
    sizes = new Float32Array(TOTAL);
    isLogo = new Uint8Array(TOTAL);
    alphas = new Float32Array(TOTAL);

    for (var i = 0; i < LOGO_COUNT; i++) {
      positions[i * 2] = Math.random() * W;
      positions[i * 2 + 1] = Math.random() * H;
      homePositions[i * 2] = logoPos[i].x;
      homePositions[i * 2 + 1] = logoPos[i].y;
      var b = 0.85 + Math.random() * 0.15;
      colors[i * 3] = b; colors[i * 3 + 1] = b; colors[i * 3 + 2] = b;
      sizes[i] = CONFIG.logoParticleSize + Math.random() * 1.5;
      isLogo[i] = 1; alphas[i] = 0.65;
    }
    for (var i = LOGO_COUNT; i < TOTAL; i++) {
      var x = Math.random() * W, y = Math.random() * H;
      positions[i * 2] = x; positions[i * 2 + 1] = y;
      homePositions[i * 2] = x; homePositions[i * 2 + 1] = y;
      var b = 0.7 + Math.random() * 0.3;
      colors[i * 3] = b; colors[i * 3 + 1] = b; colors[i * 3 + 2] = b;
      sizes[i] = CONFIG.bgParticleSize + Math.random() * 1.0;
      isLogo[i] = 0; alphas[i] = 0.2;
    }
  }

  initParticles();
  window.addEventListener('resize', function () { resize(); initParticles(); if (gathering) startTime = performance.now(); });

  var time = 0;
  var startTime = 0;
  var GATHER_DURATION = 3500;
  var gathering = false; // gather 진행 중인지

  // 초기 상태: 파티클 흩어진 채 대기 (gather 안 함)
  function scatterParticles() {
    for (var i = 0; i < LOGO_COUNT; i++) {
      positions[i * 2] = Math.random() * W;
      positions[i * 2 + 1] = Math.random() * H;
      velocities[i * 2] = 0;
      velocities[i * 2 + 1] = 0;
      alphas[i] = 0.15;
    }
  }

  function startGather() {
    scatterParticles();
    startTime = performance.now();
    gathering = true;
  }

  // 슬라이드 전환 감지: 03 슬라이드 활성화 시 scatter → gather
  window.addEventListener('heroSlideChange', function () {
    var slide = document.querySelector('.hero-slide[data-slide="1"]');
    if (slide && slide.classList.contains('active')) {
      startGather();
    } else {
      gathering = false;
    }
  });

  function updateParticles() {
    time += CONFIG.noiseSpeed;
    var elapsed = gathering ? (performance.now() - startTime) : 0;
    var gatherT = gathering ? Math.min(elapsed / GATHER_DURATION, 1.0) : 0;
    var ease = 1 - Math.pow(1 - gatherT, 3);
    var logoReturn = 0.0005 + ease * (CONFIG.returnForce - 0.0005);
    var logoNoise = 0.35 * (1 - ease * 0.3);
    var fr = 0.90 + ease * (CONFIG.friction - 0.90);
    var logoAlphaBase = 0.15 + ease * 0.50;

    var mToCx = logoCenterX - mouse.x, mToCy = logoCenterY - mouse.y;
    var mToCDist = Math.sqrt(mToCx * mToCx + mToCy * mToCy);
    var globalStr = (ease > 0.6 && mToCDist > 0.1) ? Math.max(0, 1 - mToCDist / (Math.max(W, H) * 0.8)) * 3.0 : 0;
    var gfx = mToCDist > 0.1 ? (mToCx / mToCDist) * globalStr : 0;
    var gfy = mToCDist > 0.1 ? (mToCy / mToCDist) * globalStr : 0;

    for (var i = 0; i < TOTAL; i++) {
      var ix = i * 2, iy = i * 2 + 1;
      var px = positions[ix], py = positions[iy];
      var isL = isLogo[i];
      var angle = noise2D(px * CONFIG.noiseScale, py * CONFIG.noiseScale + time) * Math.PI * 2;
      var ns = isL ? logoNoise : 0.2;
      velocities[ix] += Math.cos(angle) * ns;
      velocities[iy] += Math.sin(angle) * ns;

      var dx = px - mouse.x, dy = py - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var mouseActive = ease > 0.6;

      if (mouseActive && isL) {
        velocities[ix] += gfx; velocities[iy] += gfy;
        if (dist < CONFIG.cursorSize && dist > 0.1) {
          var f = (1 - dist / CONFIG.cursorSize) * CONFIG.mouseForce * 0.012;
          velocities[ix] += (dx / dist) * f + mouse.vx * f * 0.15;
          velocities[iy] += (dy / dist) * f + mouse.vy * f * 0.15;
        }
      } else if (mouseActive && dist < CONFIG.cursorSize && dist > 0.1) {
        var f = (1 - dist / CONFIG.cursorSize) * CONFIG.mouseForce * 0.012;
        velocities[ix] += (dx / dist) * f + mouse.vx * f * 0.2;
        velocities[iy] += (dy / dist) * f + mouse.vy * f * 0.2;
      }

      var baseA = isL ? logoAlphaBase : 0.2;
      alphas[i] += (baseA - alphas[i]) * 0.04;

      var ret = isL ? logoReturn : CONFIG.bgReturnForce;
      velocities[ix] += (homePositions[ix] - px) * ret;
      velocities[iy] += (homePositions[iy] - py) * ret;
      velocities[ix] *= fr; velocities[iy] *= fr;
      positions[ix] += velocities[ix]; positions[iy] += velocities[iy];

      if (!isL) {
        if (positions[ix] < -10) positions[ix] = W + 10;
        if (positions[ix] > W + 10) positions[ix] = -10;
        if (positions[iy] < -10) positions[iy] = H + 10;
        if (positions[iy] > H + 10) positions[iy] = -10;
      }
    }

    var sumX = 0, sumY = 0;
    for (var i = 0; i < LOGO_COUNT; i++) { sumX += positions[i * 2]; sumY += positions[i * 2 + 1]; }
    var curCx = sumX / LOGO_COUNT, curCy = sumY / LOGO_COUNT;
    for (var i = 0; i < LOGO_COUNT; i++) {
      var dx = positions[i * 2] - curCx, dy = positions[i * 2 + 1] - curCy;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > logoOuterRadius) alphas[i] *= 1.0 - Math.min((d - logoOuterRadius) / 6, 1.0);
    }
  }

  // ── WebGL shaders ──
  var vertSrc = 'attribute vec2 a_position; attribute float a_alpha; attribute vec3 a_color; attribute float a_size; uniform vec2 u_resolution; varying float v_alpha; varying vec3 v_color; void main() { vec2 clip = (a_position / u_resolution) * 2.0 - 1.0; clip.y *= -1.0; gl_Position = vec4(clip, 0.0, 1.0); gl_PointSize = a_size; v_alpha = a_alpha; v_color = a_color; }';
  var fragSrc = 'precision mediump float; varying float v_alpha; varying vec3 v_color; void main() { vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; float a = smoothstep(0.5, 0.1, d) * v_alpha; gl_FragColor = vec4(v_color, a); }';

  function createShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog); gl.useProgram(prog);

  var aPosition = gl.getAttribLocation(prog, 'a_position');
  var aAlpha = gl.getAttribLocation(prog, 'a_alpha');
  var aColor = gl.getAttribLocation(prog, 'a_color');
  var aSize = gl.getAttribLocation(prog, 'a_size');
  var uResolution = gl.getUniformLocation(prog, 'u_resolution');

  var posBuf = gl.createBuffer(), alphaBuf = gl.createBuffer();
  var colorBuf = gl.createBuffer(), sizeBuf = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

  var scaledSizes = new Float32Array(TOTAL);
  for (var i = 0; i < TOTAL; i++) scaledSizes[i] = sizes[i] * DPR;
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
  gl.bufferData(gl.ARRAY_BUFFER, scaledSizes, gl.STATIC_DRAW);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  var particleSlide = canvas.closest('.hero-slide');

  function render() {
    requestAnimationFrame(render);

    // 슬라이드 비활성 시 렌더링 스킵
    if (particleSlide && !particleSlide.classList.contains('active')) return;

    updateParticles();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.792, 0.122, 0.188, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.uniform2f(uResolution, W, H);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuf);
    gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aAlpha);
    gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
    gl.enableVertexAttribArray(aSize);
    gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, TOTAL);
  }
  requestAnimationFrame(render);
});
