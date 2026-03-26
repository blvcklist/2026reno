// ===== Hero Intro Sequence =====
// Phase 1: hero-text가 화면 중앙에서 타이핑 등장
// Phase 2: 타이핑 완료 → hero-text가 왼쪽으로 슬라이드
// Phase 3: 큐브 조립 시작 + indicator/scroll 페이드인
document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.hero');
  var firstSlide = document.querySelector('.hero-slide[data-slide="0"]');
  if (!hero || !firstSlide) return;

  var heroText = firstSlide.querySelector('.hero-text');
  var subtitle = firstSlide.querySelector('.hero-subtitle');
  var titleLines = firstSlide.querySelectorAll('.hero-title .line');
  var descPs = firstSlide.querySelectorAll('.hero-desc p');
  var indicator = document.querySelector('.hero-indicator');
  var heroScroll = document.querySelector('.hero-scroll');

  if (!heroText || !subtitle) return;

  // --- Phase 1 준비: 인트로 상태 설정 ---
  hero.classList.add('intro-phase');
  heroText.classList.add('intro-center');

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
    // --- Phase 2: 텍스트 왼쪽으로 슬라이드 ---
    setTimeout(function () {
      // intro-center 제거 → 기본 위치(좌측)로 돌아감
      // intro-slide 추가 → transition 적용
      heroText.classList.remove('intro-center');
      heroText.classList.add('intro-slide');

      // --- Phase 3: 큐브/인디케이터/스크롤 페이드인 ---
      setTimeout(function () {
        // intro-phase 제거 → 큐브 캔버스, 인디케이터, 스크롤 표시
        hero.classList.remove('intro-phase');

        // 큐브 조립 시작 신호
        window.cubeAssemblyReady = true;

        // 슬라이드 transition 완료 후 클래스 정리
        setTimeout(function () {
          heroText.classList.remove('intro-slide');
        }, 1800);
      }, 400);
    }, 600);
  }

  // 타이핑 시작
  runSequence(0);
});
