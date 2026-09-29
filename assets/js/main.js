/* Techeyes — site behaviour. No dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMAIL = 'info@techeyes.ly';
  const STORAGE_KEY = 'te-lang';

  /* ------------------------------------------------ marquee: seamless loop */
  document.querySelectorAll('[data-marquee]').forEach((track) => {
    const clone = track.cloneNode(true);
    clone.removeAttribute('data-marquee');
    clone.setAttribute('aria-hidden', 'true');
    track.after(clone);
  });

  /* ------------------------------------------------------------------ i18n */
  const source = window.TE_I18N || {};
  const strings = { en: { ...source.en }, ar: { ...source.ar } };
  const textNodes = [...document.querySelectorAll('[data-i18n]')];
  const attrNodes = [...document.querySelectorAll('[data-i18n-attr]')];
  const attrPairs = (el) => el.dataset.i18nAttr.split(';').map((pair) => pair.split(':').map((s) => s.trim()));

  // English lives in the markup: harvest it once so the HTML stays the single source of truth.
  strings.en['meta.title'] = document.title;
  textNodes.forEach((el) => {
    const key = el.dataset.i18n;
    if (!(key in strings.en)) strings.en[key] = el.innerHTML.trim();
  });
  attrNodes.forEach((el) =>
    attrPairs(el).forEach(([attr, key]) => {
      if (!(key in strings.en)) strings.en[key] = el.getAttribute(attr) || '';
    })
  );

  let lang = 'en';
  const t = (key) => strings[lang][key] ?? strings.en[key] ?? '';

  /* ------------------------------------------------------ header + menu */
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  let menuOpen = false;

  function updateMenuLabel() {
    menuToggle?.setAttribute('aria-label', t(menuOpen ? 'nav.close' : 'nav.open'));
  }

  function setMenu(open, { restoreFocus = false } = {}) {
    if (!menuToggle || !mobileMenu) return;
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    updateMenuLabel();
    if (open) mobileMenu.querySelector('a, button')?.focus({ preventScroll: true });
    else if (restoreFocus) menuToggle.focus();
  }

  menuToggle?.addEventListener('click', () => setMenu(!menuOpen));
  mobileMenu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuOpen) setMenu(false, { restoreFocus: true });
  });
  document.addEventListener('click', (event) => {
    if (menuOpen && !event.target.closest('[data-header]')) setMenu(false);
  });
  window.addEventListener(
    'resize',
    () => {
      if (menuOpen && window.innerWidth > 1080) setMenu(false);
    },
    { passive: true }
  );

  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------ language switch */
  function applyLang(next) {
    lang = next === 'ar' ? 'ar' : 'en';
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';

    textNodes.forEach((el) => {
      const value = t(el.dataset.i18n);
      if (value && el.innerHTML !== value) el.innerHTML = value;
    });
    attrNodes.forEach((el) => attrPairs(el).forEach(([attr, key]) => el.setAttribute(attr, t(key))));
    document.title = t('meta.title');

    // the toggle label is written in the language it switches *to*
    document.querySelectorAll('[data-lang-label]').forEach((el) => {
      el.lang = lang === 'ar' ? 'en' : 'ar';
    });
    updateMenuLabel();
    root.classList.remove('i18n-pending');
  }

  document.querySelectorAll('[data-lang-toggle]').forEach((button) =>
    button.addEventListener('click', () => {
      applyLang(lang === 'ar' ? 'en' : 'ar');
      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        /* storage unavailable: the choice just won't persist */
      }
      const url = new URL(window.location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', lang);
        window.history.replaceState(null, '', url);
      }
    })
  );

  applyLang(window.__TE_LANG);

  /* ------------------------------------------------------------ scrollspy */
  const navLinks = [...document.querySelectorAll('.nav__link')];
  if ('IntersectionObserver' in window && navLinks.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const active = link.hash === `#${entry.target.id}`;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    document.querySelectorAll('main > section[id]').forEach((section) => spy.observe(section));
  }

  /* --------------------------------------------------------- scroll reveal */
  const revealEls = [...document.querySelectorAll('[data-reveal]')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const reveal = new IntersectionObserver(
      (entries) => {
        let order = 0; // stagger whatever enters the viewport together
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.style.setProperty('--i', String(Math.min(order++, 6)));
          entry.target.classList.add('is-in');
          reveal.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    revealEls.forEach((el) => reveal.observe(el));
  }

  /* ------------------------------------------------ service card spotlight */
  document.querySelectorAll('[data-spotlight]').forEach((grid) => {
    const cards = [...grid.querySelectorAll('.svc')];
    let pending = 0;
    let last = null;
    grid.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      last = event;
      if (pending) return;
      pending = window.requestAnimationFrame(() => {
        pending = 0;
        cards.forEach((card) => {
          const box = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${last.clientX - box.left}px`);
          card.style.setProperty('--my', `${last.clientY - box.top}px`);
        });
      });
    });
  });

  /* -------------------------------------- hero: the eyes that keep watch
     The ring of eyes from the logo turns slowly while every pupil looks
     toward the visitor's pointer (or wanders when there is none). */
  const ring = document.querySelector('[data-eye-ring]');
  if (ring && !reduceMotion) {
    const svg = ring.ownerSVGElement;
    const pupils = [...ring.querySelectorAll('.pupil')].map((el) => ({
      el,
      x: Number(el.getAttribute('cx')),
      y: Number(el.getAttribute('cy')),
      dx: 0,
      dy: 0,
    }));
    const MAX_OFFSET = 1.1; // viewBox units the pupil may travel inside its eye
    const DEG_PER_MS = 360 / 100000; // one revolution every 100 s
    let pointer = null;
    let pointerAt = 0;
    let angle = 0;
    let lastTime = 0;
    let running = false;

    window.addEventListener(
      'pointermove',
      (event) => {
        pointer = { x: event.clientX, y: event.clientY };
        pointerAt = performance.now();
      },
      { passive: true }
    );
    document.documentElement.addEventListener('pointerleave', () => {
      pointer = null;
    });

    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(64, now - (lastTime || now));
      lastTime = now;
      angle = (angle + dt * DEG_PER_MS) % 360;
      ring.setAttribute('transform', `rotate(${angle.toFixed(3)} 50 50)`);

      const box = svg.getBoundingClientRect();
      const scale = box.width / 100;
      let tx;
      let ty;
      if (pointer && now - pointerAt < 3500) {
        tx = (pointer.x - box.left) / scale;
        ty = (pointer.y - box.top) / scale;
      } else {
        const s = now / 2600; // idle: glance around slowly
        tx = 50 + Math.cos(s) * 80;
        ty = 50 + Math.sin(s * 0.7) * 55;
      }

      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      pupils.forEach((p) => {
        // where this pupil currently is on screen (ring is rotated about 50,50)
        const px = 50 + (p.x - 50) * cos - (p.y - 50) * sin;
        const py = 50 + (p.x - 50) * sin + (p.y - 50) * cos;
        let vx = tx - px;
        let vy = ty - py;
        const dist = Math.hypot(vx, vy) || 1;
        const k = (MAX_OFFSET * Math.min(1, dist / 24)) / dist;
        vx *= k;
        vy *= k;
        // back into the ring's rotated frame
        const lx = vx * cos + vy * sin;
        const ly = -vx * sin + vy * cos;
        p.dx += (lx - p.dx) * 0.14;
        p.dy += (ly - p.dy) * 0.14;
        p.el.setAttribute('transform', `translate(${p.dx.toFixed(3)} ${p.dy.toFixed(3)})`);
      });
      window.requestAnimationFrame(frame);
    };

    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        lastTime = 0;
        window.requestAnimationFrame(frame);
      } else if (!entry.isIntersecting) {
        running = false;
      }
    }).observe(svg);
  }

  /* ------------------------------------------- assessment coverage scanner */
  const scanner = document.querySelector('[data-scanner]');
  if (scanner) {
    const items = [...scanner.querySelectorAll('.scan-item')];
    if (reduceMotion) {
      items.forEach((item) => item.classList.add('is-done'));
      scanner.classList.add('is-complete');
    } else {
      let timer = 0;
      let index = 0;
      const step = () => {
        if (index < items.length) {
          items.forEach((item, i) => item.classList.toggle('is-scanning', i === index));
          if (index > 0) items[index - 1].classList.add('is-done');
          index += 1;
          timer = window.setTimeout(step, 950);
          return;
        }
        const lastItem = items[items.length - 1];
        lastItem.classList.remove('is-scanning');
        lastItem.classList.add('is-done');
        scanner.classList.add('is-complete');
        timer = window.setTimeout(() => {
          items.forEach((item) => item.classList.remove('is-done', 'is-scanning'));
          scanner.classList.remove('is-complete');
          index = 0;
          step();
        }, 4800);
      };
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !timer) step();
          else if (!entry.isIntersecting && timer) {
            window.clearTimeout(timer);
            timer = 0;
          }
        },
        { threshold: 0.35 }
      ).observe(scanner);
    }
  }

  /* ------------------------------------------------------- contact form */
  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-form-status]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const name = `${data.get('first_name')} ${data.get('last_name')}`.trim();
    const topic = form.elements.topic.selectedOptions[0]?.textContent.trim() || '';
    const subject = `${topic} — ${name}`;
    const body = `${data.get('message')}\n\n—\n${name}\n${data.get('email')}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (status) {
      status.textContent = t('form.success');
      status.hidden = false;
    }
  });

  /* ------------------------------------------------------------- misc */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // Analytics hook: if a tag manager is added later, CTA clicks are already labelled.
  document.addEventListener('click', (event) => {
    const cta = event.target.closest('[data-cta]');
    if (cta && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'cta_click', cta_location: cta.dataset.cta, cta_url: cta.href });
    }
  });

  window.__TE_READY = true;
})();
