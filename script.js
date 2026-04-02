// ===== fullPage.js + 전체 인터랙션 통합 =====
$(document).ready(function () {

  // ========== 공용 유틸 ==========

  // resize 디바운스 (모든 핸들러 공유)
  var resizeCallbacks = [];
  var resizeTimer = null;
  function onResize(fn) { resizeCallbacks.push(fn); }
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeCallbacks.forEach(function (fn) { fn(); });
    }, 100);
  });

  // ========== 상태 ==========
  var advPlayed = false;
  var agencyPlayed = false;
  var countedUp = false;
  var gnb = document.querySelector('.gnb');

  // ========== 시퀀스 함수 ==========

  function playAdvSequence() {
    if (advPlayed) return;
    advPlayed = true;

    var ad = document.querySelector('.advertising');
    if (!ad) return;
    var introLayer = ad.querySelector('.adv-intro-layer');
    var visualLayer = ad.querySelector('.adv-visual-layer');
    var title = ad.querySelector('.adv-title');
    var desc = ad.querySelector('.adv-desc');
    if (!introLayer || !visualLayer || !title || !desc) return;

    [title, desc].forEach(function (el, i) {
      setTimeout(function () { el.classList.add('anim-in'); }, i * 150);
    });

    // fade-in(0.8s) 완료 + 400ms 유지 후 전환
    setTimeout(function () {
      introLayer.classList.add('minimized');
      visualLayer.classList.add('active');
    }, 150 + 800 + 400);
  }

  function playAgencySequence() {
    if (agencyPlayed) return;
    agencyPlayed = true;

    var ag = document.querySelector('.agency');
    if (!ag) return;
    var introLayer = ag.querySelector('.agency-intro-layer');
    var visualLayer = ag.querySelector('.agency-visual-layer');
    var title = ag.querySelector('.agency-title');
    var desc = ag.querySelector('.agency-desc');
    if (!introLayer || !visualLayer || !title || !desc) return;

    [title, desc].forEach(function (el, i) {
      setTimeout(function () { el.classList.add('anim-in'); }, i * 150);
    });

    setTimeout(function () {
      introLayer.classList.add('minimized');
      visualLayer.classList.add('active');
      // visual(1.0s) 완료 후 캐러셀 시작
      setTimeout(function () {
        window.dispatchEvent(new Event('agencyEnter'));
      }, 1050);
    }, 150 + 800 + 400);
  }

  function playWeAreSequence() {
    var leftEls = document.querySelectorAll('.weare-left .weare-title, .weare-left .weare-desc, .weare-left .weare-more');
    var rightEls = document.querySelectorAll('.weare-right .record, .weare-right .record-divider');

    leftEls.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((i + 1) * 0.2) + 's';
    });
    rightEls.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((i + 1) * 0.2) + 's';
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        leftEls.forEach(function (el) { el.classList.add('visible'); });
        rightEls.forEach(function (el) { el.classList.add('visible'); });
      });
    });

    if (!countedUp) {
      countedUp = true;
      document.querySelectorAll('.record-value').forEach(function (el) {
        animateCount(el);
      });
    }
  }

  function animateCount(el) {
    var text = el.textContent;
    var match = text.match(/(\d+)/);
    if (!match) return;
    var target = parseInt(match[0]);
    var suffix = text.replace(match[0], '');
    var duration = 2000;
    var start = performance.now();
    function update(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.innerHTML = Math.round(target * ease) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ========== GNB ==========

  function updateGnbMode(sectionEl) {
    if (!gnb) return;
    var mode = 'default';

    if (sectionEl && sectionEl.classList.contains('hero')) {
      // 히어로: 현재 활성 슬라이드 기반
      var activeSlide = sectionEl.querySelector('.hero-slide.active');
      if (activeSlide) {
        if (activeSlide.getAttribute('data-gnb-red') === 'true') {
          mode = 'red';
        } else if (activeSlide.getAttribute('data-dark') === 'true') {
          mode = 'dark';
        }
      }
    } else if (sectionEl) {
      // 히어로가 아닌 섹션: hero-dark 강제 제거
      document.body.classList.remove('hero-dark');

      if (sectionEl.classList.contains('red-bg')) {
        mode = 'red';
      } else if (sectionEl.getAttribute('data-gnb-dark') === 'true') {
        mode = 'dark';
      }
    }
    document.body.classList.toggle('gnb-dark', mode === 'dark');
    document.body.classList.toggle('gnb-red', mode === 'red');
  }
  // 하위호환 alias
  var updateGnbDark = updateGnbMode;


  // ========== fullPage 초기화 ==========

  var sections = document.querySelectorAll('.section');

  $('#fullpage').fullpage({
    sectionSelector: '.section',
    css3: false,
    scrollingSpeed: 700,
    autoScrolling: true,
    fitToSection: false,
    scrollBar: false,
    easing: 'swing',
    navigation: false,
    scrollOverflow: false,
    verticalCentered: false,

    afterLoad: function (anchorLink, index) {
      try {
        var section = sections[index - 1];
        if (!section) return;

        updateGnbDark(section);
        if (gnb) gnb.classList.toggle('sticky', index !== 1);

        if (section.classList.contains('advertising')) playAdvSequence();
        if (section.classList.contains('agency')) playAgencySequence();
        if (section.classList.contains('weare')) playWeAreSequence();
      } catch (err) { /* prevent fullPage internal state corruption */ }
    },

    onLeave: function (index, nextIndex, direction) {
      try {
        var nextSection = sections[nextIndex - 1];
        if (nextSection) updateGnbDark(nextSection);
        if (gnb) gnb.classList.toggle('sticky', nextIndex !== 1);
      } catch (err) { /* prevent fullPage internal state corruption */ }
    }
  });

  // fullPage 초기화 후 모든 캔버스 리사이즈 (실제 이벤트 dispatch로 모든 핸들러 호출)
  setTimeout(function () {
    window.dispatchEvent(new Event('resize'));
  }, 150);

  // ========== GNB 앵커 네비게이션 ==========

  var anchors = { '#advertising': 2, '#agency': 3, '#about': 4, '#contact': 5 };

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href === '#') {
        e.preventDefault();
        $.fn.fullpage.moveTo(1);
      } else if (anchors[href] !== undefined) {
        e.preventDefault();
        $.fn.fullpage.moveTo(anchors[href]);
      }
    });
  });

  // ========== Adv 슬라이드 ==========

  (function () {
    var clients = document.querySelectorAll('.adv-client');
    var cube = document.getElementById('advCube');
    if (!clients.length || !cube) return;

    var slides = cube.querySelectorAll('.adv-slide');
    var total = slides.length;
    var current = 0;
    var autoTimer = null;
    var switching = false;

    setTimeout(function () {
      for (var i = 0; i < slides.length; i++) slides[i].classList.add('ready');
    }, 100);

    function goToSlide(idx) {
      if (switching || idx === current) return;
      switching = true;
      var prev = slides[current];
      var next = slides[idx];

      next.classList.remove('out', 'ready');
      void next.offsetHeight;
      next.classList.add('ready');

      prev.classList.remove('active');
      prev.classList.add('out');
      next.classList.add('active');

      current = idx;
      clients.forEach(function (c) { c.classList.remove('active'); });
      if (clients[idx]) clients[idx].classList.add('active');

      setTimeout(function () { prev.classList.remove('out'); switching = false; }, 750);
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(function () { goToSlide((current + 1) % total); }, 4000);
    }
    function stopAuto() { if (autoTimer) clearInterval(autoTimer); }

    clients.forEach(function (btn) {
      btn.addEventListener('click', function () {
        goToSlide(parseInt(btn.dataset.index));
        startAuto();
      });
    });

    startAuto();
  })();

});
