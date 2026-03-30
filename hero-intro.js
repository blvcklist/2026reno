// ===== Hero Intro Sequence =====
// 첫 슬라이드 텍스트 요소들이 순차적으로 아래→위 페이드인
document.addEventListener('DOMContentLoaded', function () {
  var hero = document.querySelector('.hero');
  var firstSlide = document.querySelector('.hero-slide[data-slide="0"]');
  if (!hero || !firstSlide) return;

  // 페이드인 대상 수집
  var targets = [];
  var subtitle = firstSlide.querySelector('.hero-subtitle');
  var titleLines = firstSlide.querySelectorAll('.hero-title .line');
  var descPs = firstSlide.querySelectorAll('.hero-desc p');
  var aboutBtn = firstSlide.querySelector('.hero-about-btn');

  if (subtitle) targets.push(subtitle);
  for (var i = 0; i < titleLines.length; i++) targets.push(titleLines[i]);
  for (var j = 0; j < descPs.length; j++) targets.push(descPs[j]);
  if (aboutBtn) targets.push(aboutBtn);

  // 초기 상태: 숨김 클래스 부여
  for (var k = 0; k < targets.length; k++) {
    targets[k].classList.add('hero-fadein-item');
  }

  // 순차 페이드인 (각 150ms 간격)
  var STAGGER = 150;
  var INITIAL_DELAY = 400;

  for (var m = 0; m < targets.length; m++) {
    (function (el, delay) {
      setTimeout(function () {
        el.classList.add('visible');
      }, delay);
    })(targets[m], INITIAL_DELAY + m * STAGGER);
  }
});
