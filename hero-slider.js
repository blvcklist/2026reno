// ===== Hero Slider + Indicator + Typing =====
document.addEventListener('DOMContentLoaded', function () {
  var slides = document.querySelectorAll('.hero-slide');
  var items = document.querySelectorAll('.indicator-item');
  var pauseBtn = document.querySelector('.indicator-pause');

  if (!slides.length || !items.length) return;

  var idx = 0;
  var total = slides.length;
  var DURATION = 20000;
  var paused = false;
  var isTyping = false;

  // --- 타이핑 유틸 ---
  function typeHTML(el, html, speed, callback) {
    var result = '';
    var i = 0;
    var len = html.length;
    el.classList.add('hero-typing-cursor');

    function step() {
      if (i >= len) {
        el.innerHTML = html;
        el.classList.remove('hero-typing-cursor');
        if (callback) callback();
        return;
      }
      if (html[i] === '<') {
        var closeIdx = html.indexOf('>', i);
        if (closeIdx !== -1) {
          result += html.substring(i, closeIdx + 1);
          i = closeIdx + 1;
        }
      } else {
        result += html[i];
        i++;
      }
      el.innerHTML = result;
      setTimeout(step, speed);
    }
    step();
  }

  // 슬라이드의 텍스트 요소 수집
  function getTypingTargets(slide) {
    var targets = [];
    var subtitle = slide.querySelector('.hero-subtitle');
    var titleLines = slide.querySelectorAll('.hero-title .line');
    var descPs = slide.querySelectorAll('.hero-desc p');

    if (subtitle) targets.push({ el: subtitle, html: subtitle.getAttribute('data-html') || subtitle.innerHTML, speed: 40 });
    for (var i = 0; i < titleLines.length; i++) {
      targets.push({ el: titleLines[i], html: titleLines[i].getAttribute('data-html') || titleLines[i].innerHTML, speed: 30 });
    }
    for (var j = 0; j < descPs.length; j++) {
      targets.push({ el: descPs[j], html: descPs[j].getAttribute('data-html') || descPs[j].innerHTML, speed: 40 });
    }
    return targets;
  }

  // 원본 HTML 저장 (최초 1회)
  for (var s = 0; s < slides.length; s++) {
    var els = slides[s].querySelectorAll('.hero-subtitle, .hero-title .line, .hero-desc p');
    for (var e = 0; e < els.length; e++) {
      els[e].setAttribute('data-html', els[e].innerHTML);
    }
  }

  // 텍스트 비우기
  function clearSlideText(slide) {
    var els = slide.querySelectorAll('.hero-subtitle, .hero-title .line, .hero-desc p');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = '';
      els[i].classList.remove('hero-typing-cursor');
    }
  }

  // 순차 타이핑
  function typeSlide(slide, callback) {
    var targets = getTypingTargets(slide);
    clearSlideText(slide);
    isTyping = true;

    function run(index) {
      if (index >= targets.length) {
        isTyping = false;
        if (callback) callback();
        return;
      }
      var t = targets[index];
      var delay = index === 0 ? 300 : 150;
      setTimeout(function () {
        typeHTML(t.el, t.html, t.speed, function () {
          run(index + 1);
        });
      }, delay);
    }
    run(0);
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
        if (callback) callback();
      }, 500);
    } else {
      if (callback) callback();
    }
  }

  function activate(withTyping) {
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
          // 타이핑 중에는 게이지 시작을 지연
          if (withTyping) {
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

    // 타이핑 효과
    if (withTyping) {
      typeSlide(slides[idx], function () {
        // 타이핑 완료 후 게이지 시작
        var prog = items[idx].querySelector('.indicator-gauge-progress');
        if (prog) {
          prog.style.animation = 'gauge ' + DURATION + 'ms linear forwards';
          prog.style.width = '';
        }
      });
    }
  }

  function goTo(index) {
    if (isTyping) return;
    var prevIdx = idx;
    idx = ((index % total) + total) % total;
    if (prevIdx === idx) return;

    // 이전 슬라이드 텍스트 페이드아웃 → 새 슬라이드 활성화 + 타이핑
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
        pauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="8,4 20,12 8,20" fill="' + fillColor + '"/></svg>';
      } else {
        pauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="13.5" y="6" width="3" height="12" fill="' + fillColor + '"/><rect x="7.5" y="6" width="3" height="12" fill="' + fillColor + '"/></svg>';
      }
    });
  }

  // 초기 실행 (타이핑 없이 — hero-intro.js가 첫 슬라이드 타이핑 담당)
  activate(false);
});
