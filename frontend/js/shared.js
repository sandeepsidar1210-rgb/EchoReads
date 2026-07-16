/* ============================================================
   EchoReads — Shared JS Component Injector
   Injects navbar, footer, handles auth state,
   cart badge, scroll reveal, and mobile drawer.
   ============================================================ */

(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  function getUser() {
    try { return JSON.parse(localStorage.getItem('echoreads_user') || 'null'); } catch { return null; }
  }
  function getToken() { return localStorage.getItem('echoreads_token') || ''; }
  function signOut() {
    localStorage.removeItem('echoreads_user');
    localStorage.removeItem('echoreads_token');
    window.location.href = 'index.html';
  }

  // ── Nav Link Config ──────────────────────────────────────
  const NAV_LINKS = [
    { href: 'index.html',    label: 'Home',     icon: '🏠' },
    { href: 'browse.html',   label: 'Browse',   icon: '📚' },
    { href: 'genres.html',   label: 'Genres',   icon: '🎭' },
    { href: 'novia.html',    label: 'Novia AI', icon: '🤖' },
    { href: 'cart.html',     label: 'Cart',     icon: '🛒', cart: true },
    { href: 'purchases.html',label: 'Library',  icon: '📖' },
  ];

  // ── Inject Navbar ────────────────────────────────────────
  function injectNavbar() {
    const nav = document.createElement('nav');
    nav.id = 'er-navbar';

    const linksHTML = NAV_LINKS.map(l => {
      const active = currentPath === l.href ? 'active' : '';
      const badge = l.cart ? '<span class="er-nav-cart-badge" id="er-cart-count" style="display:none">0</span>' : '';
      return `<li><a href="${l.href}" class="${active}">${l.label}${badge}</a></li>`;
    }).join('');

    const mobileLinksHTML = NAV_LINKS.map(l => {
      const active = currentPath === l.href ? 'active' : '';
      return `<a href="${l.href}" class="${active}">${l.icon} ${l.label}</a>`;
    }).join('');

    nav.innerHTML = `
      <div class="er-navbar-inner">
        <a href="index.html" class="er-logo"><span class="gold">Echo</span><span class="white">Reads</span></a>
        <ul class="er-nav-links">${linksHTML}</ul>
        <div class="er-nav-auth" id="er-nav-auth">
          <a href="signin.html" id="er-signin-link" class="er-btn er-btn-outline er-btn-sm">Sign In</a>
        </div>
        <button class="er-hamburger" id="er-hamburger" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="er-mobile-overlay" id="er-overlay"></div>
      <div class="er-mobile-drawer" id="er-drawer">
        <button class="er-mobile-close" id="er-drawer-close">✕</button>
        <a href="index.html" class="er-logo" style="margin-bottom:20px;font-size:1.4rem"><span class="gold">Echo</span><span class="white">Reads</span></a>
        ${mobileLinksHTML}
        <div style="margin-top:auto;padding-top:24px;border-top:1px solid var(--color-border);">
          <div id="er-mobile-auth"></div>
        </div>
      </div>
    `;

    document.body.prepend(nav);

    // Scroll effect
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
    if (window.scrollY > 20) nav.classList.add('scrolled');

    // Hamburger
    const hamburger = $('#er-hamburger');
    const drawer = $('#er-drawer');
    const overlay = $('#er-overlay');
    const drawerClose = $('#er-drawer-close');

    function openDrawer() { drawer.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeDrawer() { drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }
    hamburger?.addEventListener('click', openDrawer);
    drawerClose?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);
  }

  // ── Update Auth UI ───────────────────────────────────────
  function updateAuthUI() {
    const user = getUser();
    const authEl = $('#er-nav-auth');
    const mobileAuth = $('#er-mobile-auth');

    if (user && user.name) {
      if (authEl) {
        authEl.innerHTML = `
          <span class="er-user-pill" title="${user.email || ''}">👤 ${user.name}</span>
          <button class="er-btn er-btn-danger er-btn-sm" id="er-signout-btn">Sign Out</button>
        `;
      }
      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <p style="font-size:.8rem;color:var(--color-text-secondary);margin-bottom:12px">Signed in as <strong style="color:#fff">${user.name}</strong></p>
          <button class="er-btn er-btn-danger er-btn-sm" style="width:100%;justify-content:center" id="er-signout-mobile">Sign Out</button>
        `;
        $('#er-signout-mobile')?.addEventListener('click', signOut);
      }
      $('#er-signout-btn')?.addEventListener('click', signOut);

      // Fetch cart count
      fetchCartCount();
    }
  }

  // ── Cart Badge ───────────────────────────────────────────
  async function fetchCartCount() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/cart/mine', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.data) {
        const count = data.data.length;
        const badge = $('#er-cart-count');
        if (badge && count > 0) {
          badge.textContent = count > 9 ? '9+' : count;
          badge.style.display = 'inline-flex';
        }
      }
    } catch { /* no-op */ }
  }

  // ── Inject Footer ────────────────────────────────────────
  function injectFooter() {
    const footer = document.createElement('footer');
    footer.id = 'er-footer';
    footer.innerHTML = `
      <div class="er-footer-inner">
        <div class="er-footer-grid">
          <div>
            <div class="er-footer-logo"><span class="text-gradient-gold">Echo</span><span style="color:#fff">Reads</span></div>
            <p class="er-footer-tagline">Your AI-powered literary universe. Discover, read, and listen — anywhere.</p>
          </div>
          <div>
            <p class="er-footer-col-title">Product</p>
            <ul class="er-footer-links">
              <li><a href="browse.html">Browse Books</a></li>
              <li><a href="genres.html">Genres</a></li>
              <li><a href="novia.html">Novia AI</a></li>
              <li><a href="features.html">Features</a></li>
            </ul>
          </div>
          <div>
            <p class="er-footer-col-title">Company</p>
            <ul class="er-footer-links">
              <li><a href="about.html">About Us</a></li>
              <li><a href="careers.html">Careers</a></li>
              <li><a href="press.html">Press</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          <div>
            <p class="er-footer-col-title">Legal</p>
            <ul class="er-footer-links">
              <li><a href="terms.html">Terms of Service</a></li>
              <li><a href="privacy.html">Privacy Policy</a></li>
              <li><a href="security.html">Security</a></li>
              <li><a href="faq.html">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div class="er-footer-bottom">
          <span>© 2026 EchoReads. All rights reserved.</span>
          <span>Built with ❤️ for book lovers worldwide</span>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  }

  // ── Scroll Reveal ────────────────────────────────────────
  function initScrollReveal() {
    const els = $$('.er-reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  }

  // ── Animated Counters ────────────────────────────────────
  function initCounters() {
    const counters = $$('[data-count]');
    if (!counters.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const step = target / (duration / 16);
        let current = 0;
        const tick = () => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current).toLocaleString() + suffix;
          if (current < target) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => io.observe(el));
  }

  // ── Boot ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    updateAuthUI();

    // Only inject footer if page has er-page wrapper
    if ($('.er-page')) injectFooter();

    initScrollReveal();
    initCounters();
  });

})();
