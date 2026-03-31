// ===== Agency Carousel (Infinite Loop) =====
document.addEventListener('DOMContentLoaded', function () {
  var track = document.getElementById('agencyTrack');
  if (!track) return;
  var originalCards = Array.prototype.slice.call(track.querySelectorAll('.agency-card'));
  if (!originalCards.length) return;
  var dotsContainer = document.querySelector('.carousel-dots');
  var leftBtn = document.querySelector('.arrow-left');
  var rightBtn = document.querySelector('.arrow-right');
  var viewport = document.querySelector('.carousel-viewport');
  var area = document.querySelector('.agency-visual-layer');

  var total = originalCards.length;
  var CLONES = total;
  var AUTO_DURATION = 5000;
  var paused = false;
  var pauseBtn = document.querySelector('.carousel-pause');

  // 앞뒤에 클론 추가
  for (var i = 0; i < CLONES; i++) {
    var cloneBefore = originalCards[total - 1 - (i % total)].cloneNode(true);
    cloneBefore.classList.add('clone');
    track.insertBefore(cloneBefore, track.firstChild);
  }
  for (var i = 0; i < CLONES; i++) {
    var cloneAfter = originalCards[i % total].cloneNode(true);
    cloneAfter.classList.add('clone');
    track.appendChild(cloneAfter);
  }

  var allCards = Array.prototype.slice.call(track.querySelectorAll('.agency-card'));
  var allTotal = allCards.length;
  var current = CLONES;

  // dots 생성
  dotsContainer.innerHTML = '';
  for (var k = 0; k < total; k++) {
    var dot = document.createElement('span');
    dot.className = 'dot' + (k === 0 ? ' active' : '');
    var prog = document.createElement('span');
    prog.className = 'dot-progress';
    dot.appendChild(prog);
    dotsContainer.appendChild(dot);
  }
  var dots = dotsContainer.querySelectorAll('.dot');

  var gap = 16;
  var isTransitioning = false;
  var started = false;

  function getCardW() { return allCards[0].offsetWidth; }

  function positionTrack(animated) {
    var cardW = getCardW();
    var vpW = viewport.offsetWidth;
    if (!cardW || !vpW) return; // 아직 레이아웃 안 됨
    var offset = current * (cardW + gap);
    var center = (vpW - cardW) / 2;

    if (!animated) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    track.style.transform = 'translateX(' + (-offset + center) + 'px)';

    if (!animated) void track.offsetHeight;
  }

  var glowEl = document.getElementById('carouselGlow');

  function updateCards() {
    for (var i = 0; i < allTotal; i++) {
      var diff = i - current;
      var absDiff = Math.abs(diff);
      var dir = diff < 0 ? -1 : 1;
      allCards[i].classList.remove('active-card', 'side-card', 'far-card');
      allCards[i].style.setProperty('--side-dir', dir);
      if (absDiff === 0) {
        allCards[i].classList.add('active-card');
        var glowColor = allCards[i].getAttribute('data-glow');
        if (glowEl && glowColor) {
          var r = parseInt(glowColor.slice(1,3), 16);
          var g = parseInt(glowColor.slice(3,5), 16);
          var b = parseInt(glowColor.slice(5,7), 16);
          glowEl.style.setProperty('--glow-color', 'rgba(' + r + ',' + g + ',' + b + ',0.6)');
        }
      } else if (absDiff === 1) {
        allCards[i].classList.add('side-card');
      } else {
        allCards[i].classList.add('far-card');
      }
    }

    var realIndex = ((current - CLONES) % total + total) % total;
    for (var j = 0; j < dots.length; j++) {
      var p = dots[j].querySelector('.dot-progress');
      dots[j].classList.remove('active');
      if (p) {
        p.style.animation = 'none';
        void p.offsetHeight;
        p.style.width = '0';
      }
    }
    dots[realIndex].classList.add('active');
    var activeProg = dots[realIndex].querySelector('.dot-progress');
    if (activeProg) {
      activeProg.style.animation = 'dotFill ' + AUTO_DURATION + 'ms linear forwards';
      if (paused) activeProg.style.animationPlayState = 'paused';
    }
  }

  function goTo(index, animated) {
    if (isTransitioning) return;
    current = index;
    if (animated !== false) animated = true;
    positionTrack(animated);
    updateCards();
    if (animated) isTransitioning = true;
  }

  // transitionend — track 자체만 처리, 버블링 차단
  track.addEventListener('transitionend', function (e) {
    e.stopPropagation(); // fullPage 간섭 방지
    if (e.target !== track) return;
    isTransitioning = false;

    if (current >= CLONES + total) {
      current = current - total;
      positionTrack(false);
      updateCards();
    } else if (current < CLONES) {
      current = current + total;
      positionTrack(false);
      updateCards();
    }
  });

  // animationend — 버블링 차단
  dotsContainer.addEventListener('animationend', function (e) {
    e.stopPropagation(); // fullPage 간섭 방지
    if (e.target.classList.contains('dot-progress') && !paused) {
      goTo(current + 1);
    }
  });

  if (rightBtn) rightBtn.addEventListener('click', function () { goTo(current + 1); });
  if (leftBtn) leftBtn.addEventListener('click', function () { goTo(current - 1); });
  for (var d = 0; d < dots.length; d++) {
    (function (i) {
      dots[i].addEventListener('click', function () { goTo(CLONES + i); });
    })(d);
  }

  // Touch/swipe
  var startX = 0;
  track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    var diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) goTo(current + (diff < 0 ? 1 : -1));
  });

  // 일시정지/재생
  function pauseProgress() {
    var realIndex = ((current - CLONES) % total + total) % total;
    var p = dots[realIndex].querySelector('.dot-progress');
    if (p) p.style.animationPlayState = 'paused';
  }
  function resumeProgress() {
    var realIndex = ((current - CLONES) % total + total) % total;
    var p = dots[realIndex].querySelector('.dot-progress');
    if (p) p.style.animationPlayState = 'running';
  }
  function updatePauseIcon() {
    if (!pauseBtn) return;
    var fill = '#101820';
    if (paused) {
      pauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="7.5,7 16.5,12 7.5,17.4" fill="' + fill + '"/></svg>';
    } else {
      pauseBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="13.5" y="6" width="3" height="12" fill="' + fill + '"/><rect x="7.5" y="6" width="3" height="12" fill="' + fill + '"/></svg>';
    }
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      if (paused) pauseProgress(); else resumeProgress();
      updatePauseIcon();
    });
  }

  if (area) {
    area.addEventListener('mouseenter', function () { if (!paused) pauseProgress(); });
    area.addEventListener('mouseleave', function () { if (!paused) resumeProgress(); });
  }

  // resize — 디바운스된 핸들러 사용
  window.addEventListener('resize', function () {
    if (!started) return;
    // 자체 디바운스 (공용과 별도 — track 위치만 업데이트)
    positionTrack(false);
  });

  // 초기: 모여있는 상태
  track.classList.add('gathered');
  positionTrack(false);
  updateCards();

  // 캐러셀 시작
  function startCarousel() {
    if (started) return;
    started = true;
    track.classList.remove('gathered');
    setTimeout(function () {
      positionTrack(false);
      updateCards();
      // 카드 펼침 완료 후 glow 서서히 등장
      if (glowEl) glowEl.style.opacity = '1';
    }, 1200);
  }

  window.addEventListener('agencyEnter', startCarousel);
});
