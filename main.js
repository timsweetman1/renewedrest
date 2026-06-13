// Renewed Rest — main.js v2

// Nav scroll shadow
window.addEventListener('scroll', () => {
  document.querySelector('.nav')?.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile menu
function openMenu()  { document.getElementById('drawer').classList.add('open'); }
function closeMenu() { document.getElementById('drawer').classList.remove('open'); }
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
  initCarousel('tCarousel', 'tDots');
  initFAQ();
  initCalc();
});
