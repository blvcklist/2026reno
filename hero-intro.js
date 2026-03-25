// ===== Hero Intro Sequence =====
// 1. hero-text 타이핑 효과
// 2. 타이핑 완료 → cube 조립 시작 + indicator 페이드인
document.addEventListener('DOMContentLoaded', function () {
  var firstSlide = document.querySelector('.hero-slide[data-slide="0"]');
  if (!firstSlide) return;
  var subtitle = firstSlide.querySelector('.hero-subtitle');
  var titleLines = firstSlide.querySelectorAll('.hero-title .line');
  var descPs = firstSlide.querySelectorAll('.hero-desc p');
  var indicator = document.querySelector('.hero-indicator');

  if (!subtitle) return;

  // 타이핑할 요소들을 순서대로 수집
  var typingTargets = [];

  // subtitle
  typingTargets.push({ el: subtitle, html: subtitle.innerHTML, speed: 40 });

  // title lines
  for (var i = 0; i < titleLines.length; i++) {
    typingTargets.push({ el: titleLines[i], html: titleLines[i].innerHTML, speed: 30 });
  }

  // desc
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

      // HTML 태그는 한 번에 추가
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

  // 순차 타이핑 실행
  function runSequence(index) {
    if (index >= typingTargets.length) {
      // 타이핑 완료 → cube 조립 시작 + indicator 페이드인
      onTypingComplete();
      return;
    }

    var target = typingTargets[index];
    var delay = index === 0 ? 300 : 150; // 첫 번째는 약간 대기

    setTimeout(function () {
      typeHTML(target.el, target.html, target.speed, function () {
        runSequence(index + 1);
      });
    }, delay);
  }

  function onTypingComplete() {
    // cube 조립 시작 신호
    window.cubeAssemblyReady = true;

    // indicator 페이드인
    if (indicator) {
      setTimeout(function () {
        indicator.classList.add('intro-visible');
      }, 500);
    }
  }

  // 타이핑 시작
  runSequence(0);
});
