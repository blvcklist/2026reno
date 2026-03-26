// ===== Hero Intro Sequence =====
// Phase 1: hero-text가 원래 자리에서 타이핑 등장
// Phase 2: 타이핑 완료 → 큐브 조립 시작 + indicator/scroll 페이드인
document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.hero');
  var firstSlide = document.querySelector('.hero-slide[data-slide="0"]');
  if (!hero || !firstSlide) return;

  var heroText = firstSlide.querySelector('.hero-text');
  var subtitle = firstSlide.querySelector('.hero-subtitle');
  var titleLines = firstSlide.querySelectorAll('.hero-title .line');
  var descPs = firstSlide.querySelectorAll('.hero-desc p');

  if (!heroText || !subtitle) return;

  // --- Phase 1 준비: 큐브/인디케이터/스크롤 숨김 ---
  hero.classList.add('intro-phase');

  // 타이핑할 요소들을 순서대로 수집
  var typingTargets = [];
  typingTargets.push({ el: subtitle, html: subtitle.innerHTML, speed: 40 });
  for (var i = 0; i < titleLines.length; i++) {
    typingTargets.push({ el: titleLines[i], html: titleLines[i].innerHTML, speed: 30 });
  }
  for (var j = 0; j < descPs.length; j++) {
    typingTargets.push({ el: descPs[j], html: descPs[j].innerHTML, speed: 40 });
  }

  // 모든 텍스트 비우기
  for (var k = 0; k < typingTargets.length; k++) {
    typingTargets[k].el.textContent = '';
  }

  // HTML 태그를 보존하면서 타이핑
  function typeHTML(el, html, speed, callback) {
    var result = '';
    var idx = 0;
    var len = html.length;
    el.classList.add('hero-typing-cursor');

    function step() {
      if (idx >= len) {
        el.innerHTML = html;
        el.classList.remove('hero-typing-cursor');
        if (callback) callback();
        return;
      }
      if (html[idx] === '<') {
        var closeIdx = html.indexOf('>', idx);
        if (closeIdx !== -1) {
          result += html.substring(idx, closeIdx + 1);
          idx = closeIdx + 1;
        }
      } else {
        result += html[idx];
        idx++;
      }
      el.innerHTML = result;
      setTimeout(step, speed);
    }
    step();
  }

  // 순차 타이핑 실행
  function runSequence(index) {
    if (index >= typingTargets.length) {
      onTypingComplete();
      return;
    }
    var target = typingTargets[index];
    var delay = index === 0 ? 500 : 150;
    setTimeout(function () {
      typeHTML(target.el, target.html, target.speed, function () {
        runSequence(index + 1);
      });
    }, delay);
  }

  function onTypingComplete() {
    // 타이핑 완료 후 큐브/인디케이터/스크롤 페이드인
    setTimeout(function () {
      hero.classList.remove('intro-phase');
      window.cubeAssemblyReady = true;
    }, 600);
  }

  // 타이핑 시작
  runSequence(0);
});
