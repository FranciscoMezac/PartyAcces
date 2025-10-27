// nav-toggle.js - toggler del navbar superior sin Bootstrap JS
(function () {
  const toggle = document.getElementById('navToggle');
  const nav    = document.getElementById('navbarNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('show');
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
  });
})();
