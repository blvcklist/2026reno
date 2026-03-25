// ===== Hero Slider + Indicator =====
// 독립 실행 — 다른 JS에 의존하지 않음
document.addEventListener('DOMContentLoaded', function () {
  var slides = document.querySelectorAll('.hero-slide');
  var items = document.querySelectorAll('.indicator-item');
  var pauseBtn = document.querySelector('.indicator-pause');

  if (!slides.length || !items.length) return;

  var idx = 0;
  var total = slides.length;
  var DURATION = 20000;
  var paused = false;

  function activate() {
    // 슬라이드 전환
    var isDark = false;
    for (var i = 0; i < total; i++) {
      if (i === idx) {
        slides[i].classList.add('active');
        if (slides[i].getAttribute('data-dark') === 'true') isDark = true;
      } else {
        slides[i].classList.remove('active');
      }
    }

    // 어두운 슬라이드일 때 body에 클래스 토글
    if (isDark) {
      document.body.classList.add('hero-dark');
    } else {
      document.body.classList.remove('hero-dark');
    }

    // GNB 다크 모드 연동 이벤트
    window.dispatchEvent(new Event('heroSlideChange'));

    // 인디케이터 게이지
    for (var j = 0; j < items.length; j++) {
      var prog = items[j].querySelector('.indicator-gauge-progress');
      if (j === idx) {
        items[j].classList.add('active');
      } else {
        items[j].classList.remove('active');
      }
      if (prog) {
        prog.style.animation = 'none';
        void prog.offsetHeight;
        if (j === idx) {
          prog.style.animation = 'gauge ' + DURATION + 'ms linear forwards';
          prog.style.width = '';
        } else {
          prog.style.animation = 'none';
          prog.style.width = '0';
        }
      }
    }
  }

  function goTo(index) {
    idx = ((index % total) + total) % total;
    activate();
  }

  // 게이지 완료 → 다음 슬라이드
  for (var k = 0; k < items.length; k++) {
    (function (item) {
      var prog = item.querySelector('.indicator-gauge-progress');
      if (prog) {
        prog.addEventListener('animationend', function () {
          if (!paused) goTo(idx + 1);
        });
      }
    })(items[k]);
  }

  // 인디케이터 클릭 → 해당 슬라이드
  for (var m = 0; m < items.length; m++) {
    (function (index) {
      items[index].style.cursor = 'pointer';
      items[index].addEventListener('click', function () {
        goTo(index);
      });
    })(m);
  }

  // 일시정지/재생
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      var prog = items[idx].querySelector('.indicator-gauge-progress');
      if (prog) {
        prog.style.animationPlayState = paused ? 'paused' : 'running';
      }
      var fillColor = document.body.classList.contains('hero-dark') ? '#fff' : '#101820';
      if (paused) {
        pauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="8,4 20,12 8,20" fill="' + fillColor + '"/></svg>';
      } else {
        pauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="13.5" y="6" width="3" height="12" fill="' + fillColor + '"/><rect x="7.5" y="6" width="3" height="12" fill="' + fillColor + '"/></svg>';
      }
    });
  }

  // 초기 실행
  activate();
});
