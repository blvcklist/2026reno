// ===== Hero Slider + Indicator + FadeIn =====
document.addEventListener('DOMContentLoaded', function () {
  var slides = document.querySelectorAll('.hero-slide');
  var items = document.querySelectorAll('.indicator-item');
  var pauseBtn = document.querySelector('.indicator-pause');

  if (!slides.length || !items.length) return;

  var idx = 0;
  var total = slides.length;
  var DURATION = 20000;
  var paused = false;
  var isAnimating = false;

  var STAGGER = 150;

  // 슬라이드 내 페이드인 대상 수집
  function getFadeinTargets(slide) {
    var targets = [];
    var subtitle = slide.querySelector('.hero-subtitle');
    var titleLines = slide.querySelectorAll('.hero-title .line');
    var descPs = slide.querySelectorAll('.hero-desc p');
    var aboutBtn = slide.querySelector('.hero-about-btn');

    if (subtitle) targets.push(subtitle);
    for (var i = 0; i < titleLines.length; i++) targets.push(titleLines[i]);
    for (var j = 0; j < descPs.length; j++) targets.push(descPs[j]);
    if (aboutBtn) targets.push(aboutBtn);
    return targets;
  }

  // 페이드인 클래스 초기화 (숨김)
  function hideSlideText(slide) {
    var targets = getFadeinTargets(slide);
    for (var i = 0; i < targets.length; i++) {
      targets[i].classList.add('hero-fadein-item');
      targets[i].classList.remove('visible');
    }
  }

  // 순차 페이드인
  function fadeInSlideText(slide, callback) {
    var targets = getFadeinTargets(slide);
    isAnimating = true;

    for (var i = 0; i < targets.length; i++) {
      targets[i].classList.add('hero-fadein-item');
      targets[i].classList.remove('visible');
    }

    // 약간의 딜레이 후 순차적으로 visible 추가
    void slide.offsetHeight;
    for (var m = 0; m < targets.length; m++) {
      (function (el, delay) {
        setTimeout(function () {
          el.classList.add('visible');
        }, delay);
      })(targets[m], 100 + m * STAGGER);
    }

    // 마지막 요소 애니메이션 완료 후 콜백
    var totalTime = 100 + targets.length * STAGGER + 700;
    setTimeout(function () {
      isAnimating = false;
      if (callback) callback();
    }, totalTime);
  }

  // 이전 슬라이드 텍스트 페이드아웃
  function fadeOutSlideText(slide, callback) {
    var textEl = slide.querySelector('.hero-text');
    if (textEl) {
      textEl.style.transition = 'opacity 0.5s ease';
      textEl.style.opacity = '0';
      setTimeout(function () {
        textEl.style.transition = '';
        textEl.style.opacity = '';
        hideSlideText(slide);
        if (callback) callback();
      }, 500);
    } else {
      if (callback) callback();
    }
  }

  function activate(withFadeIn) {
    var isDark = false;
    for (var i = 0; i < total; i++) {
      if (i === idx) {
        slides[i].classList.add('active');
        if (slides[i].getAttribute('data-dark') === 'true') isDark = true;
      } else {
        slides[i].classList.remove('active');
      }
    }

    if (isDark) {
      document.body.classList.add('hero-dark');
    } else {
      document.body.classList.remove('hero-dark');
    }

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
          if (withFadeIn) {
            prog.style.width = '0';
          } else {
            prog.style.animation = 'gauge ' + DURATION + 'ms linear forwards';
            prog.style.width = '';
          }
        } else {
          prog.style.animation = 'none';
          prog.style.width = '0';
        }
      }
    }

    // 페이드인 효과
    if (withFadeIn) {
      fadeInSlideText(slides[idx], function () {
        var prog = items[idx].querySelector('.indicator-gauge-progress');
        if (prog) {
          prog.style.animation = 'gauge ' + DURATION + 'ms linear forwards';
          prog.style.width = '';
        }
      });
    }
  }

  function goTo(index) {
    if (isAnimating) return;
    var prevIdx = idx;
    idx = ((index % total) + total) % total;
    if (prevIdx === idx) return;

    fadeOutSlideText(slides[prevIdx], function () {
      activate(true);
    });
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

  // 인디케이터 클릭
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
        pauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="7.5,7 16.5,12 7.5,17.4" fill="' + fillColor + '"/></svg>';
      } else {
        pauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="13.5" y="6" width="3" height="12" fill="' + fillColor + '"/><rect x="7.5" y="6" width="3" height="12" fill="' + fillColor + '"/></svg>';
      }
    });
  }

  // 초기 실행 (페이드인 없이 — hero-intro.js가 첫 슬라이드 담당)
  activate(false);
});
