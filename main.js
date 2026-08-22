// Renewed Rest — main.js v2

// Nav scroll shadow
window.addEventListener('scroll', () => {
  document.querySelector('.nav')?.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile menu
function setMenuState(open) {
  const drawer = document.getElementById('drawer');
  const trigger = document.querySelector('.hamburger, .nav-hamburger');
  if (!drawer) return;
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  trigger?.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}
function openMenu()  { setMenuState(true); }
function closeMenu() { setMenuState(false); }
function toggleMenu() {
  const drawer = document.getElementById('drawer');
  drawer.classList.contains('open') ? closeMenu() : openMenu();
}
// Close drawer when tapping outside
document.addEventListener('click', e => {
  const drawer = document.getElementById('drawer');
  if (!drawer) return;
  if (drawer.classList.contains('open') && !drawer.contains(e.target) && !e.target.closest('.hamburger')) closeMenu();
});

// Testimonial carousel
function initCarousel(trackId, dotsId) {
  const inner = document.querySelector(`#${trackId} .carousel-inner`);
  if (!inner) return;
  const slides = inner.querySelectorAll('.carousel-slide');
  const dotsEl = document.getElementById(dotsId);
  let cur = 0;
  const n = slides.length;
  if (dotsEl) {
    dotsEl.innerHTML = '';
    slides.forEach((_,i) => {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i===0?' active':'');
      d.type = 'button';
      d.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      d.onclick = () => go(i);
      dotsEl.appendChild(d);
    });
  }
  function go(idx) {
    cur = ((idx % n) + n) % n;
    inner.style.transform = `translateX(-${cur*100}%)`;
    dotsEl?.querySelectorAll('.carousel-dot').forEach((d,i) => d.classList.toggle('active', i===cur));
  }
  let t = setInterval(() => go(cur+1), 5000);
  inner.addEventListener('mouseenter', () => clearInterval(t));
  inner.addEventListener('mouseleave', () => { t = setInterval(() => go(cur+1), 5000); });
}

// FAQ
function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
}

// Add-on calculator
function initCalc() {
  const cards = document.querySelectorAll('.addon-card');
  const totalEl = document.getElementById('addonTotal');
  const countEl = document.getElementById('addonCount');
  if (!cards.length || !totalEl) return;
  function update() {
    let t=0, c=0;
    document.querySelectorAll('.addon-card.selected').forEach(el => { t += parseInt(el.dataset.price||0); c++; });
    totalEl.textContent = '$'+t;
    if (countEl) countEl.textContent = c;
  }
  cards.forEach(c => c.addEventListener('click', () => { c.classList.toggle('selected'); update(); }));
}

document.addEventListener('DOMContentLoaded', () => {
  const drawer = document.getElementById('drawer');
  const trigger = document.querySelector('.hamburger, .nav-hamburger');
  if (drawer) {
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Site navigation');
  }
  if (trigger && drawer) {
    trigger.setAttribute('aria-controls', drawer.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Toggle navigation menu');
  }
  document.querySelectorAll('.drawer-close').forEach((button) => button.setAttribute('aria-label', 'Close menu'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  document.querySelectorAll('main img').forEach((img, index) => {
    if (index > 0 && !img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  });
  initCarousel('tCarousel', 'tDots');
  initFAQ();
  initCalc();
});
