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

      // 배경 밝기에 따라 dark/light 전환
      var isDark = document.body.classList.contains('hero-dark');
      cursorEl.classList.toggle('dark', isDark);

      requestAnimationFrame(moveCursor);
    })();
  }

});
