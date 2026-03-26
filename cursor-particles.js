// ===== Hero Custom Cursor + Light Refraction =====
document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  // --- 커스텀 커서 (빨간 원 + "we are") ---
  var cursorEl = document.getElementById('heroCursor');
  if (cursorEl) {
    var cx = { x: -100, y: -100 };
    var cxSmooth = { x: -100, y: -100 };

    hero.addEventListener('mousemove', function (e) {
      cx.x = e.clientX;
      cx.y = e.clientY;
    });
    hero.addEventListener('mouseenter', function () {
      cursorEl.classList.add('visible');
    });
    hero.addEventListener('mouseleave', function () {
      cursorEl.classList.remove('visible');
      cx.x = -100; cx.y = -100;
    });

    (function moveCursor() {
      cxSmooth.x += (cx.x - cxSmooth.x) * 0.15;
      cxSmooth.y += (cx.y - cxSmooth.y) * 0.15;
      cursorEl.style.left = cxSmooth.x + 'px';
      cursorEl.style.top = cxSmooth.y + 'px';
      requestAnimationFrame(moveCursor);
    })();
  }

  // --- 유리 빛 반사 파티클 ---

  var canvas = document.createElement('canvas');
  canvas.className = 'cursor-particles-canvas';
  hero.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W, H;
  var mouse = { x: -200, y: -200 };
  var smoothMouse = { x: -200, y: -200 };
  var particles = [];
  var MAX = 60;

  function resize() {
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width = W * 2;
    canvas.height = H * 2;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(2, 2);
  }
  resize();
  window.addEventListener('resize', resize);

  // 프리즘 색상 팔레트 (유리 빛 반사)
  var prismColors = [
    { r: 180, g: 220, b: 255 },  // 시원한 화이트블루
    { r: 200, g: 180, b: 255 },  // 라벤더
    { r: 255, g: 200, b: 180 },  // 웜 피치
    { r: 180, g: 255, b: 240 },  // 민트
    { r: 255, g: 255, b: 220 },  // 웜 화이트
    { r: 220, g: 200, b: 255 },  // 소프트 퍼플
  ];

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // 빛 파편 생성
    for (var i = 0; i < 2; i++) {
      if (particles.length < MAX) {
        var color = prismColors[Math.floor(Math.random() * prismColors.length)];
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.3 + Math.random() * 1.2;
        var type = Math.random();

        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 60,
          y: mouse.y + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.2,
          life: 1,
          decay: 0.004 + Math.random() * 0.008,
          size: type < 0.3 ? 1 + Math.random() * 2 : 2 + Math.random() * 5,
          color: color,
          type: type < 0.3 ? 'dot' : type < 0.7 ? 'flare' : 'streak',
          angle: angle,
          rotSpeed: (Math.random() - 0.5) * 0.04,
        });
      }
    }
  });

  hero.addEventListener('mouseleave', function () {
    mouse.x = -200;
    mouse.y = -200;
  });

  function drawFlare(p) {
    var alpha = p.life * p.life * 0.4;
    var s = p.size * p.life;
    var c = p.color;

    // 메인 글로우
    var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 2);
    grad.addColorStop(0, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')');
    grad.addColorStop(0.4, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (alpha * 0.3) + ')');
    grad.addColorStop(1, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * 2, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 밝은 중심점
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.8) + ')';
    ctx.fill();
  }

  function drawStreak(p) {
    var alpha = p.life * p.life * 0.35;
    var len = p.size * p.life * 3;
    var c = p.color;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    var grad = ctx.createLinearGradient(-len, 0, len, 0);
    grad.addColorStop(0, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
    grad.addColorStop(0.5, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')');
    grad.addColorStop(1, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');

    ctx.beginPath();
    ctx.moveTo(-len, -0.5);
    ctx.lineTo(len, -0.5);
    ctx.lineTo(len, 0.5);
    ctx.lineTo(-len, 0.5);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  function drawDot(p) {
    var alpha = p.life * 0.6;
    var s = p.size * p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
    ctx.fill();
  }

  // 마우스 주변 글로우
  function drawCursorGlow() {
    if (smoothMouse.x < -100) return;
    var grad = ctx.createRadialGradient(smoothMouse.x, smoothMouse.y, 0, smoothMouse.x, smoothMouse.y, 120);
    grad.addColorStop(0, 'rgba(200,220,255,0.06)');
    grad.addColorStop(0.5, 'rgba(180,200,255,0.02)');
    grad.addColorStop(1, 'rgba(180,200,255,0)');
    ctx.beginPath();
    ctx.arc(smoothMouse.x, smoothMouse.y, 120, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    // 부드러운 마우스 추적
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.1;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.1;

    drawCursorGlow();

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.angle += p.rotSpeed;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      if (p.type === 'flare') {
        drawFlare(p);
      } else if (p.type === 'streak') {
        drawStreak(p);
      } else {
        drawDot(p);
      }
    }
  }
  animate();
});
