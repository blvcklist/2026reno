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
  var area = document.querySelector('.agency-carousel-area');

  var total = originalCards.length;
  var CLONES = total; // 앞뒤로 전체 세트를 복제
  var AUTO_DURATION = 5000;

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
  // 실제 인덱스: CLONES 오프셋 (첫 번째 원본 카드 = index CLONES)
  var current = CLONES; // 첫 번째 원본 카드부터 시작

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

  function getCardW() {
    return allCards[0].offsetWidth;
  }

  function positionTrack(animated) {
    var cardW = getCardW();
    var vpW = viewport.offsetWidth;
    var offset = current * (cardW + gap);
    var center = (vpW - cardW) / 2;

    if (!animated) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    track.style.transform = 'translateX(' + (-offset + center) + 'px)';

    if (!animated) {
      void track.offsetHeight; // force reflow
    }
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
        // glow 색상 연동
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

    // dot 업데이트
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
    }
  }

  function goTo(index, animated) {
    if (isTransitioning) return;
    current = index;
    if (animated !== false) animated = true;
    positionTrack(animated);
    updateCards();

    if (animated) {
      isTransitioning = true;
    }
  }

  // 트랜지션 끝나면 경계 넘은 경우 순간 이동
  track.addEventListener('transitionend', function (e) {
    // track 자체의 transform 트랜지션만 처리 (자식 이벤트 무시)
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

  // progress 애니메이션 완료 → 다음
  dotsContainer.addEventListener('animationend', function (e) {
    if (e.target.classList.contains('dot-progress')) {
      goTo(current + 1);
    }
  });

  if (rightBtn) rightBtn.addEventListener('click', function () { goTo(current + 1); });
  if (leftBtn) leftBtn.addEventListener('click', function () { goTo(current - 1); });
  for (var d = 0; d < dots.length; d++) {
    (function (i) {
      dots[i].addEventListener('click', function () {
        goTo(CLONES + i);
      });
    })(d);
  }

  // Touch/swipe
  var startX = 0;
  track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    var diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) goTo(current + (diff < 0 ? 1 : -1));
  });

  // Hover 일시정지
  var paused = false;
  if (area) {
    area.addEventListener('mouseenter', function () {
      paused = true;
      var realIndex = ((current - CLONES) % total + total) % total;
      var p = dots[realIndex].querySelector('.dot-progress');
      if (p) p.style.animationPlayState = 'paused';
    });
    area.addEventListener('mouseleave', function () {
      paused = false;
      var realIndex = ((current - CLONES) % total + total) % total;
      var p = dots[realIndex].querySelector('.dot-progress');
      if (p) p.style.animationPlayState = 'running';
    });
  }

  window.addEventListener('resize', function () {
    positionTrack(false);
  });

  // 초기: 모여있는 상태
  track.classList.add('gathered');
  positionTrack(false);
  updateCards();

  // 영역 진입 시 펼쳐지면서 캐러셀 시작
  var started = false;
  var carouselObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !started) {
        started = true;
        // gathered 제거 → 카드가 좌우로 펼쳐짐
        track.classList.remove('gathered');
        // 펼쳐진 후 자동재생 시작
        setTimeout(function () {
          startAuto();
        }, 1400);
      }
    });
  }, { threshold: 0.2 });

  carouselObserver.observe(area);
});
