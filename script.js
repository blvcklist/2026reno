// ===== GNB Sticky + Dark Mode by Section =====
(function () {
  const gnb = document.querySelector('.gnb');
  if (!gnb) return;

  const hero = document.querySelector('.hero');
  const allSections = document.querySelectorAll('section, footer');

  function checkDark() {
    const gnbBottom = gnb.offsetHeight + 10;
    let isDark = false;

    // 모든 섹션을 순회하면서 GNB 위치에 있는 최상위(z-index가 높은) 섹션 찾기
    // hero는 sticky라서 항상 뒤에 있고, 다른 섹션이 위를 덮으면 그 섹션 기준으로 판단
    let heroCovers = false;

    allSections.forEach(function (section) {
      if (section === hero) return; // hero는 별도 처리
      const rect = section.getBoundingClientRect();
      if (rect.top < gnbBottom && rect.bottom > gnbBottom) {
        // 이 섹션이 GNB 위치를 덮고 있음
        heroCovers = false; // hero가 아닌 섹션이 덮고 있으므로 hero 무시
        if (section.getAttribute('data-gnb-dark') === 'true') {
          isDark = true;
        } else {
          isDark = false;
        }
      }
    });

    // 어떤 섹션도 GNB를 덮지 않으면 hero가 보이는 상태
    if (!isDark) {
      let anyCoversGnb = false;
      allSections.forEach(function (section) {
        if (section === hero) return;
        const rect = section.getBoundingClientRect();
        if (rect.top < gnbBottom && rect.bottom > gnbBottom) {
          anyCoversGnb = true;
        }
      });

      if (!anyCoversGnb && document.body.classList.contains('hero-dark')) {
        isDark = true;
      }
    }

    document.body.classList.toggle('gnb-dark', isDark);
  }

  var heroScroll = document.querySelector('.hero-scroll');

  window.addEventListener('scroll', () => {
    gnb.classList.toggle('sticky', window.scrollY > 80);
    checkDark();
    if (heroScroll) {
      heroScroll.style.opacity = window.scrollY > 10 ? '0' : '';
    }
  });

  window.addEventListener('heroSlideChange', checkDark);
  checkDark();
})();

// ===== Adv Client Navigation + Slot Slide =====
(function () {
  var clients = document.querySelectorAll('.adv-client');
  var cube = document.getElementById('advCube');
  if (!clients.length || !cube) return;

  var slides = cube.querySelectorAll('.adv-slide');
  var total = slides.length;
  var current = 0;
  var autoTimer = null;
  var switching = false;

  // 첫 슬라이드 즉시 표시 후, 모든 슬라이드에 transition 활성화
  setTimeout(function () {
    for (var i = 0; i < slides.length; i++) {
      slides[i].classList.add('ready');
    }
  }, 100);

  function goToSlide(idx) {
    if (switching || idx === current) return;
    switching = true;

    var prev = slides[current];
    var next = slides[idx];

    // 새 슬라이드: 아래 위치로 즉시 이동
    next.classList.remove('out', 'ready');
    void next.offsetHeight;
    next.classList.add('ready');

    // 이전 슬라이드: 위로 밀려남 + 새 슬라이드: 올라옴
    prev.classList.remove('active');
    prev.classList.add('out');
    next.classList.add('active');

    current = idx;
    clients.forEach(function (c) { c.classList.remove('active'); });
    if (clients[idx]) clients[idx].classList.add('active');

    setTimeout(function () {
      prev.classList.remove('out');
      switching = false;
    }, 750);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(function () {
      goToSlide((current + 1) % total);
    }, 4000);
  }

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
  }

  clients.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.dataset.index);
      goToSlide(idx);
      startAuto();
    });
  });

  startAuto();
})();

// ===== Smooth anchor scroll =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Apple-style Scroll Interactions =====
(function () {

  // --- 1. Staggered Reveal (시차 fade-up) ---
  const staggerGroups = [
    { parent: '.weare-left', children: '.weare-title, .weare-desc, .weare-more', baseDelay: 0 },
    { parent: '.weare-right', children: '.record, .record-divider', baseDelay: 0 },
  ];

  staggerGroups.forEach(({ parent, children, baseDelay }) => {
    const container = document.querySelector(parent);
    if (!container) return;
    const els = container.querySelectorAll(children);
    els.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = (baseDelay + (i + 1) * 0.25) + 's';
    });
  });

  // --- Adv 시퀀스 (텍스트 fade-in → 2s hold → fade-out → visual fade-in) ---
  (function () {
    const advertising = document.querySelector('.advertising');
    if (!advertising) return;

    const introLayer = advertising.querySelector('.adv-intro-layer');
    const visualLayer = advertising.querySelector('.adv-visual-layer');
    const title = advertising.querySelector('.adv-title');
    const desc = advertising.querySelector('.adv-desc');
    if (!introLayer || !visualLayer || !title || !desc) return;

    const items = [title, desc];
    let played = false;

    const advObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !played) {
          played = true;

          // 1초 대기 후 순차 fade-in
          items.forEach((el, i) => {
            setTimeout(() => el.classList.add('anim-in'), 1000 + i * 300);
          });

          // 마지막 요소 등장 완료 + 2초 유지 → fade-out text → fade-in visual
          const fadeOutDelay = 1000 + (items.length - 1) * 300 + 1400 + 1000;
          setTimeout(() => {
            introLayer.classList.add('minimized');
            visualLayer.classList.add('active');
          }, fadeOutDelay);
        }
      });
    }, { threshold: 0.3 });

    advObserver.observe(advertising);
  })();

  // --- Agency 시퀀스 (텍스트 fade-in → 2s hold → slide out → visual slide in) ---
  (function () {
    const agencySection = document.querySelector('.agency');
    if (!agencySection) return;

    const introLayer = agencySection.querySelector('.agency-intro-layer');
    const visualLayer = agencySection.querySelector('.agency-visual-layer');
    const title = agencySection.querySelector('.agency-title');
    const desc = agencySection.querySelector('.agency-desc');
    if (!introLayer || !visualLayer || !title || !desc) return;

    const items = [title, desc];
    let played = false;

    const agcObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !played) {
          played = true;

          items.forEach((el, i) => {
            setTimeout(() => el.classList.add('anim-in'), 1000 + i * 300);
          });

          const fadeOutDelay = 1000 + (items.length - 1) * 300 + 1400 + 1000;
          setTimeout(() => {
            introLayer.classList.add('minimized');
            visualLayer.classList.add('active');
            // 비주얼 레이어 transition 중/후 캐러셀 위치 재계산
            setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 1850);
          }, fadeOutDelay);
        }
      });
    }, { threshold: 0.3 });

    agcObserver.observe(agencySection);
  })();

  // 개별 reveal 요소
  document.querySelectorAll('.hero-indicator, .carousel-dots')
    .forEach(el => el.classList.add('reveal-scale'));


  // --- 2. Intersection Observer (reveal 트리거) ---
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal, .reveal-scale, .reveal-from-right, .reveal-from-left')
    .forEach(el => revealObserver.observe(el));

  // --- 3. Parallax (스크롤 기반 이동) ---
  const parallaxEls = [
    { el: document.querySelector('.agency-bg-logo'), speed: 0.12 },
    { el: document.querySelector('.hero-text'), speed: 0.05 },
  ].filter(p => p.el);

  // --- 4. Hero 텍스트 fade-out on scroll ---
  const heroText = document.querySelector('.hero-text');
  const heroSection = document.querySelector('.hero');

  // --- 5. Record 카운트업 애니메이션 ---
  const recordValues = document.querySelectorAll('.record-value');
  let countedUp = false;

  function animateCount(el) {
    const text = el.textContent;
    const match = text.match(/(\d+)/);
    if (!match) return;

    const target = parseInt(match[0]);
    const suffix = text.replace(match[0], '');
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * ease);
      el.innerHTML = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countedUp) {
        countedUp = true;
        recordValues.forEach(el => animateCount(el));
      }
    });
  }, { threshold: 0.3 });

  recordValues.forEach(el => countObserver.observe(el));

  // --- 6. Scroll handler (parallax + hero fade) ---
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // Parallax
      parallaxEls.forEach(({ el, speed }) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        el.style.transform = `translateY(${center * speed * -1}px)`;
      });

      // Hero text fade-out as you scroll down
      if (heroText && heroSection) {
        const heroH = heroSection.offsetHeight;
        const progress = Math.min(scrollY / (heroH * 0.6), 1);
        heroText.style.opacity = 1 - progress;
        heroText.style.transform = `translateY(${progress * -30}px)`;
      }

      ticking = false;
    });
  });

})();

// ===== Full-page Section Scroll Snap =====
(function () {
  var sections = Array.prototype.slice.call(
    document.querySelectorAll('.hero, .advertising, .agency, .weare, .footer')
  );
  if (!sections.length) return;

  var scrolling = false;
  var cooldown = 1000;

  // 각 섹션의 scrollTop 위치를 계산 (hero는 0)
  function getSectionTops() {
    var tops = [];
    for (var i = 0; i < sections.length; i++) {
      if (i === 0) {
        tops.push(0); // hero는 sticky이므로 0
      } else {
        tops.push(sections[i].offsetTop);
      }
    }
    return tops;
  }

  function getCurrentIndex() {
    var scrollY = window.scrollY;
    var tops = getSectionTops();
    var current = 0;

    for (var i = tops.length - 1; i >= 0; i--) {
      if (scrollY >= tops[i] - window.innerHeight * 0.3) {
        current = i;
        break;
      }
    }
    return current;
  }

  function scrollToSection(index) {
    if (index < 0 || index >= sections.length) return;
    scrolling = true;

    var tops = getSectionTops();
    window.scrollTo({ top: tops[index], behavior: 'smooth' });

    setTimeout(function () { scrolling = false; }, cooldown);
  }

  window.addEventListener('wheel', function (e) {
    if (scrolling) return;
    e.preventDefault();

    var current = getCurrentIndex();
    if (e.deltaY > 0) {
      scrollToSection(current + 1);
    } else if (e.deltaY < 0) {
      scrollToSection(current - 1);
    }
  }, { passive: false });

  // 모바일 터치 스와이프
  var touchStartY = 0;
  window.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (scrolling) return;
    var diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) < 50) return;

    var current = getCurrentIndex();
    if (diff > 0) {
      scrollToSection(current + 1);
    } else {
      scrollToSection(current - 1);
    }
  });
})();
