(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* nav: shadow on scroll + burger + current section */
  const nav = $('.nav');
  const burger = $('#burger');
  const links = $('#navLinks');
  const setMenu = (open) => {
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeModal(); } });

  const fab = $('#fab');
  const apply = $('#apply');
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', scrollY > 8);
    const r = apply.getBoundingClientRect();
    fab.classList.toggle('is-hidden', scrollY < 400 || (r.top < innerHeight && r.bottom > 0));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const sections = $$('main section[id]');
  const navMap = new Map($$('a:not(.btn)', links).map(a => [a.getAttribute('href').slice(1), a]));
  const io2 = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navMap.forEach(a => a.classList.remove('is-current'));
      navMap.get(en.target.id)?.classList.add('is-current');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => io2.observe(s));

  /* reveal */
  const io = new IntersectionObserver(entries => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const sibs = [...en.target.parentElement.children];
        en.target.style.transitionDelay = sibs.indexOf(en.target) * 80 + 'ms';
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  /* tabs */
  const tabs = $$('.tab');
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { select((i + 1) % tabs.length); tabs[(i + 1) % tabs.length].focus(); }
      if (e.key === 'ArrowLeft') { const j = (i - 1 + tabs.length) % tabs.length; select(j); tabs[j].focus(); }
    });
  });
  function select(i) {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      const p = $('#' + t.getAttribute('aria-controls'));
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
  }

  /* salary calculator (illustrative numbers) */
  const RATE = 105;           // ₴/hour
  const MAX = 40000;
  const shifts = $('#shifts'), shiftsOut = $('#shiftsOut');
  const night = $('#night'), bonus = $('#bonus');
  let hours = 10;
  const fmt = n => Math.round(n).toLocaleString('uk-UA');
  let shown = 0, raf;
  function animateTo(target) {
    cancelAnimationFrame(raf);
    if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown = target; $('#sum').textContent = fmt(target); return;
    }
    const from = shown, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 500);
      shown = from + (target - from) * (1 - Math.pow(1 - k, 3));
      $('#sum').textContent = fmt(shown);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function calc() {
    const s = +shifts.value;
    shiftsOut.textContent = s;
    shifts.style.setProperty('--p', ((s - shifts.min) / (shifts.max - shifts.min) * 100) + '%');
    const base = s * hours * RATE;
    const n = night.checked ? base * 0.2 : 0;
    const b = bonus.checked ? 2500 : 0;
    const total = base + n + b;
    $('#bBase').textContent = fmt(base) + ' ₴';
    $('#bNight').textContent = n ? '+' + fmt(n) + ' ₴' : '—';
    $('#bBonus').textContent = b ? '+' + fmt(b) + ' ₴' : '—';
    $('#barFill').style.width = Math.min(100, total / MAX * 100) + '%';
    animateTo(total);
  }
  shifts.addEventListener('input', calc);
  night.addEventListener('change', calc);
  bonus.addEventListener('change', calc);
  $$('.seg__b').forEach(b => b.addEventListener('click', () => {
    $$('.seg__b').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', String(x === b)); });
    hours = +b.dataset.hours;
    calc();
  }));
  calc();

  /* FAQ: one open at a time */
  const dets = $$('.faq details');
  dets.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) dets.forEach(o => o !== d && (o.open = false));
  }));

  /* form */
  const form = $('#form');
  const phone = $('#phone');
  phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+380 '; });
  phone.addEventListener('blur', () => { if (phone.value.trim() === '+380') phone.value = ''; });
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('380')) d = d.slice(3);
    else if (d.startsWith('0')) d = d.slice(1);
    d = d.slice(0, 9);
    const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
    phone.value = '+380 ' + p.join(' ');
  });

  const msg = $('#msg');
  msg.addEventListener('input', () => { $('#msgCount').textContent = msg.value.length; });

  const rules = [
    [$('#name'), el => el.value.trim().split(/\s+/).length >= 2 && el.value.trim().length >= 3],
    [phone, el => el.value.replace(/\D/g, '').length === 12],
    [$('#city'), el => !!el.value],
    [$('#age'), el => +el.value >= 18 && +el.value <= 70],
    [$('[name=zone]'), () => $$('[name=zone]').some(x => x.checked)],
    [$('[name=sched]'), () => $$('[name=sched]').some(x => x.checked)],
    [$('[name=exp]'), () => $$('[name=exp]').some(x => x.checked)],
    [$('#agree'), el => el.checked],
  ];
  const fieldOf = el => el.closest('.field');
  function check(el, ok) {
    const f = fieldOf(el);
    f.classList.remove('is-bad');
    if (!ok) { void f.offsetWidth; f.classList.add('is-bad'); }
    return ok;
  }
  rules.forEach(([el, test]) => {
    const f = fieldOf(el);
    f.addEventListener('change', () => { if (f.classList.contains('is-bad')) check(el, test(el)); });
    f.addEventListener('input', () => { if (f.classList.contains('is-bad') && test(el)) f.classList.remove('is-bad'); });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = rules.filter(([el, test]) => !check(el, test(el)));
    if (bad.length) {
      $('#formStatus').textContent = `Перевірте поля: ${bad.length}`;
      const f = fieldOf(bad[0][0]);
      f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (f.querySelector('input:not([type=checkbox]):not([type=radio]),select') || f.querySelector('input'))?.focus({ preventScroll: true });
      return;
    }
    const btn = $('#submit');
    btn.classList.add('is-loading');
    $('.btn__txt', btn).textContent = 'Надсилаємо…';
    setTimeout(() => {
      btn.classList.remove('is-loading');
      $('.btn__txt', btn).textContent = 'Надіслати анкету';
      $('#formStatus').textContent = 'Анкету заповнено';
      const first = $('#name').value.trim().split(/\s+/)[0];
      $('#mTitle').textContent = `Дякуємо, ${first}!`;
      $('#mText').textContent = `Ви заповнили анкету. Менеджер з персоналу SPAR (${$('#city').value}) зв'яжеться з вами протягом 2 робочих днів.`;
      openModal();
      form.reset();
      $('#msgCount').textContent = '0';
    }, 1100);
  });

  /* modal */
  const modal = $('#modal');
  let lastFocus;
  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal__box .btn', modal).focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  }
  $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));
})();
