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

  window.addEventListener('scroll', () => {
    gnb.classList.toggle('sticky', window.scrollY > 80);
    checkDark();
  });

  window.addEventListener('heroSlideChange', checkDark);
  checkDark();
})();

// ===== Adv Client Navigation + Cube Slide =====
(function () {
  const clients = document.querySelectorAll('.adv-client');
  const cube = document.getElementById('advCube');
  if (!clients.length || !cube) return;

  var total = 4;
  var current = 0;
  var rotation = 0; // 누적 회전 각도
  var autoTimer = null;

  var slideData = [
    { category: '스크린 광고', name: 'LOTTE Cinema' },
    { category: '항공 광고', name: 'KOREAN AIR' },
    { category: '스포츠 광고', name: 'GOLFZON' },
    { category: '모빌리티 광고', name: 'kakaomobility' },
  ];

  var infoEl = document.getElementById('advVisualInfo');
  var categoryEl = infoEl ? infoEl.querySelector('.adv-visual-category') : null;
  var nameEl = infoEl ? infoEl.querySelector('.adv-visual-name') : null;

  function setCubeSize() {
    var viewport = cube.parentElement;
    var h = viewport.clientHeight;
    cube.style.setProperty('--cube-z', (h / 2) + 'px');
  }

  function goToSlide(idx) {
    // 현재→목표까지 최단 정방향(위로) 회전량 계산
    var diff = ((idx - current) % total + total) % total;
    if (diff === 0 && idx !== current) diff = total;
    rotation += diff * 90;
    current = idx;

    cube.style.transform = 'rotateX(' + rotation + 'deg)';
    clients.forEach(function (c) { c.classList.remove('active'); });
    if (clients[idx]) clients[idx].classList.add('active');
    if (categoryEl && nameEl && slideData[idx]) {
      categoryEl.textContent = slideData[idx].category;
      nameEl.textContent = slideData[idx].name;
    }
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

  setCubeSize();
  window.addEventListener('resize', setCubeSize);
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
    { parent: '.adv-text', children: '.adv-title, .adv-desc', baseDelay: 0 },
    { parent: '.agency-text', children: '.agency-title, .agency-desc', baseDelay: 0 },
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

  // 개별 reveal 요소
  document.querySelectorAll('.hero-indicator, .skills-marquee, .carousel-dots')
    .forEach(el => el.classList.add('reveal-scale'));

  // adv-visual, adv-clients 순차 페이드인
  const advGlass = document.querySelector('.adv-glass');
  if (advGlass) { advGlass.classList.add('reveal'); advGlass.style.transitionDelay = '0.9s'; }
  const advClients = document.querySelector('.adv-clients');
  if (advClients) { advClients.classList.add('reveal'); advClients.style.transitionDelay = '1.4s'; }

  // adv-marquee rows: 첫번째 오른쪽에서, 두번째 왼쪽에서
  const marqueeRows = document.querySelectorAll('.adv-marquee-row');
  if (marqueeRows.length >= 2) {
    marqueeRows[0].classList.add('reveal-from-right');
    marqueeRows[0].style.transitionDelay = '1.9s';
    marqueeRows[1].classList.add('reveal-from-left');
    marqueeRows[1].style.transitionDelay = '2.2s';
  }

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
    { el: document.querySelector('.adv-glass'), speed: 0.08 },
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

// ===== Hero ↔ Next Section Scroll Snap =====
(function () {
  const hero = document.querySelector('.hero');
  const nextSection = document.querySelector('.hero + section');
  if (!hero || !nextSection) return;

  let scrolling = false;
  const heroH = function () { return hero.offsetHeight; };

  window.addEventListener('wheel', function (e) {
    if (scrolling) return;

    // Hero에서 아래로 → 다음 섹션
    if (window.scrollY < heroH() * 0.5 && e.deltaY > 0) {
      scrolling = true;
      nextSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(function () { scrolling = false; }, 1000);
      return;
    }

    // Advertising 상단 근처에서 위로 → Hero로
    if (e.deltaY < 0 && window.scrollY > 0 && window.scrollY < heroH() * 1.5) {
      scrolling = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () { scrolling = false; }, 1000);
      return;
    }
  }, { passive: true });
})();
