// public/js/base.js
// Menú móvil simple sin Bootstrap JS.
(function () {
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isHidden = links.classList.contains('d-none');
    links.classList.toggle('d-none', !isHidden);
    links.classList.toggle('d-md-flex', true);
    links.classList.toggle('flex-column', isHidden);
    links.classList.toggle('gap-3', true);
    links.classList.toggle('mt-3', isHidden);
  });
})();

/* ====== Limitar la altura del carrusel a la de la card ====== */
(function syncCarouselHeight() {
  const card = document.getElementById('heroCard');
  const carousel = document.getElementById('heroCarousel');
  if (!card || !carousel) return;

  function apply() {
    const h = Math.round(card.getBoundingClientRect().height);
    carousel.style.setProperty('--hero-card-max', h + 'px');
  }

  // Aplica al cargar y al redimensionar
  apply();
  window.addEventListener('resize', apply);

  // Si el contenido de la card cambia de alto, vuelve a calcular
  if ('ResizeObserver' in window) {
    new ResizeObserver(apply).observe(card);
  }
})();
/* ====== Carrusel Bootstrap-like sin Bootstrap JS ====== */
(function bootstraplessCarousel(){
  const root = document.getElementById('carouselExample');
  if (!root) return;

  const items = Array.from(root.querySelectorAll('.carousel-item'));
  const prev  = root.querySelector('.carousel-control-prev');
  const next  = root.querySelector('.carousel-control-next');
  if (items.length === 0) return;

  let index = Math.max(0, items.findIndex(el => el.classList.contains('active')));
  if (index === -1) { index = 0; items[0].classList.add('active'); }

  function show(i){
    items[index].classList.remove('active');
    index = (i + items.length) % items.length;
    items[index].classList.add('active');
  }

  prev?.addEventListener('click', () => show(index - 1));
  next?.addEventListener('click', () => show(index + 1));

  const autoplay = root.dataset.autoplay === 'true';
  const interval = parseInt(root.dataset.interval || '4000', 10);
  let timer = null;

  function start(){ if (!autoplay) return; stop(); timer = setInterval(() => show(index + 1), interval); }
  function stop(){ if (timer) clearInterval(timer); }

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  start();
})();
