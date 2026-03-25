// ===== Hero Cursor Particles =====
// 마우스 주변에 작은 파티클이 따라다니며, 배경에 따라 색상 변경
document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'cursor-particles-canvas';
  hero.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W, H;
  var mouse = { x: -100, y: -100 };
  var particles = [];
  var MAX = 80;

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

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // 마우스 이동 시 파티클 생성
    for (var i = 0; i < 3; i++) {
      if (particles.length < MAX) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1 + Math.random() * 3;
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 40,
          y: mouse.y + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.006 + Math.random() * 0.012,
          size: 1.5 + Math.random() * 3.5,
        });
      }
    }
  });

  hero.addEventListener('mouseleave', function () {
    mouse.x = -100;
    mouse.y = -100;
  });

  function getColor() {
    var isDark = document.body.classList.contains('hero-dark');
    return isDark ? '255,255,255' : '202,43,48';
  }

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    var color = getColor();

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + color + ',' + (p.life * 0.5) + ')';
      ctx.fill();
    }
  }
  animate();
});
