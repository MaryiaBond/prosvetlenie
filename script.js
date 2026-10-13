(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* --- конфигурация тарифов и скидок --- */
  const tariffConfig = [
    {
      id: 'opora',
      name: 'Опора',
      price: 5900,
      discountPercent: 20,
      discountEnabled: false
    },
    {
      id: 'opora-sammi',
      name: 'Опора + Сэмми',
      priceRange: '39 000–45 000 ₽',
      discountPercent: null,
      discountEnabled: false
    }
  ];

  const formatPrice = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

  tariffConfig.forEach((tariff) => {
    const price = $(`[data-tariff-price="${tariff.id}"]`);
    if (!price) return;

    const current = $('.tariff-price__current', price);
    const old = $('.tariff-price__old', price);
    const badge = $('.tariff-price__badge', price);
    const note = $('.tariff-price__discount-note', price);
    const canCalculateDiscount = tariff.discountEnabled
      && Number.isFinite(tariff.price)
      && Number.isFinite(tariff.discountPercent)
      && tariff.discountPercent > 0;

    current.textContent = Number.isFinite(tariff.price) ? formatPrice(tariff.price) : tariff.priceRange;

    if (!canCalculateDiscount) return;

    const discountedPrice = Math.round(tariff.price * (1 - tariff.discountPercent / 100));
    old.textContent = formatPrice(tariff.price);
    current.textContent = formatPrice(discountedPrice);
    badge.textContent = `−${tariff.discountPercent}%`;
    old.hidden = false;
    badge.hidden = false;
    note.hidden = false;
  });

  /* --- появление блоков при скролле --- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    io.observe(el);
  });

  const tariffsHead = $('.tariffs__head');
  const tariffCards = $$('.tariff-card');
  if (tariffsHead) tariffsHead.style.transitionDelay = '0ms';
  tariffCards.forEach((card, index) => {
    card.style.transitionDelay = `${(index + 1) * 150}ms`;
  });

  const tariffsSection = $('.tariffs');
  const discountBadges = $$('.tariff-price__badge:not([hidden])');
  if (tariffsSection && discountBadges.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const badgeObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      setTimeout(() => discountBadges.forEach((badge) => badge.classList.add('is-visible')), 700);
      observer.unobserve(tariffsSection);
    }, { threshold: 0.2 });
    badgeObserver.observe(tariffsSection);
  } else {
    discountBadges.forEach((badge) => badge.classList.add('is-visible'));
  }

  /* --- кинематографичное появление секции Сэмми --- */
  const sammi = $('.sammi');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (sammi && !reduce && 'IntersectionObserver' in window) {
    sammi.dataset.animate = 'true';
    const sammiObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      sammi.classList.add('is-visible');
      observer.unobserve(sammi);
    }, { threshold: 0.2 });
    sammiObserver.observe(sammi);
  } else if (sammi) {
    sammi.classList.add('is-visible');
  }

  /* --- лёгкий параллакс для фигур --- */
  const parallaxEls = $$('[data-speed]');
  let ticking = false;

  const onScroll = () => {
    if (ticking || reduce) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.speed);
        const rect = el.parentElement.getBoundingClientRect();
        const offset = (rect.top + window.scrollY - y) * 0; // база
        el.style.transform = `translate3d(0, ${(y - el.parentElement.offsetTop) * speed + offset}px, 0)`;
      });
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- мобильное меню --- */
  const burger = $('.burger');
  const nav = $('.nav');

  const setMenuOpen = (open) => {
    burger.classList.toggle('open', open);
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  };

  burger.addEventListener('click', () => {
    setMenuOpen(!nav.classList.contains('open'));
  });
  $$('.nav a').forEach((a) =>
    a.addEventListener('click', () => setMenuOpen(false))
  );

  /* --- модальное окно --- */
  const modal = $('.modal');
  const form = $('.form');
  const errorEl = $('.form__error');
  let lastModalTrigger = null;

  const openModal = (trigger) => {
    lastModalTrigger = trigger;
    const tariff = tariffConfig.find((item) => item.id === trigger.dataset.tariff);
    if (tariff) {
      $('#selected-tariff').textContent = tariff.name;
      form.elements.tariff.value = tariff.id;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => {
      if (modal.classList.contains('open')) $('input', form).focus();
    }, 150);
  };
  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastModalTrigger) lastModalTrigger.focus();
  };

  $$('.js-open-modal').forEach((b) => b.addEventListener('click', (e) => openModal(e.currentTarget)));
  $('.modal__close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('open')) closeModal();
    else if (nav.classList.contains('open')) setMenuOpen(false);
  });

  $$('input', form).forEach((input) => {
    input.addEventListener('input', () => { errorEl.textContent = ''; });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    if (name.length < 2) { errorEl.textContent = 'Введи имя'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = 'Проверь email'; return; }
    errorEl.textContent = '';

    // TODO: подключить backend и показывать success-состояние только после подтверждённой отправки.
    // $('.modal__box').classList.add('sent');
    errorEl.textContent = 'Форма заявки пока не подключена. Отправка временно недоступна.';
  });
})();
