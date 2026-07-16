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

  // ── Toast Notification ────────────────────────────────────
  window.showToast = function(msg, isError = false) {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;border-radius:var(--radius-md);font-size:.85rem;font-weight:600;
      background:${isError ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)'};
      border:1px solid ${isError ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.4)'};
      color:${isError ? 'var(--color-rose)' : 'var(--color-emerald)'};
      backdrop-filter:blur(12px);transition:opacity 0.3s;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  };

  // ── Global Book Details Modal ─────────────────────────────
  window.showBookDetails = async function(bookId) {
    let modal = document.getElementById('er-global-book-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'er-global-book-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="er-modal-overlay" onclick="window.closeBookDetails(event)">
        <div class="er-modal-box" onclick="event.stopPropagation()">
          <button onclick="window.closeBookDetails()" class="er-modal-close">✕</button>
          <div style="display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:start;">
            <div class="er-skeleton" style="width:200px;height:280px;border-radius:var(--radius-lg);"></div>
            <div>
              <div class="er-skeleton" style="height:20px;width:120px;margin-bottom:12px;"></div>
              <div class="er-skeleton" style="height:32px;width:260px;margin-bottom:8px;"></div>
              <div class="er-skeleton" style="height:18px;width:100px;margin-bottom:20px;"></div>
              <div class="er-skeleton" style="height:100px;width:100%;"></div>
            </div>
          </div>
        </div>
      </div>`;

    const token = getToken();
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      const book = data.data;

      // Check if book has a pdfUrl or standard free fallback
      const pdfLink = book.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

      modal.innerHTML = `
        <div class="er-modal-overlay" onclick="window.closeBookDetails(event)">
          <div class="er-modal-box" onclick="event.stopPropagation()">
            <button onclick="window.closeBookDetails()" class="er-modal-close">✕</button>
            <div style="display:grid;grid-template-columns:220px 1fr;gap:32px;align-items:start;flex-wrap:wrap;">
              <img src="${book.imageUrl || ''}" alt="${book.title}" style="width:100%;border-radius:var(--radius-lg);box-shadow:var(--shadow-card);" />
              <div>
                <span class="er-badge er-badge-teal" style="margin-bottom:12px;display:inline-flex;">${book.genre}</span>
                <h2 style="font-size:1.8rem;font-weight:900;margin-bottom:6px;letter-spacing:-0.3px;">${book.title}</h2>
                <p style="color:var(--color-text-secondary);margin-bottom:16px;">by <strong style="color:var(--color-text-primary);">${book.author}</strong></p>
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                  <span style="color:var(--color-gold);">⭐ ${book.rating}</span>
                  <span style="color:var(--color-text-muted);font-size:.8rem;">${book.totalRatings} ratings</span>
                </div>
                <h4 style="font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:8px;">Summary</h4>
                <p style="font-size:.875rem;color:var(--color-text-secondary);line-height:1.75;margin-bottom:24px;">${book.summary || book.description || 'No summary available.'}</p>
                
                <div style="display:flex;align-items:center;justify-content:space-between;padding-top:20px;border-top:1px solid var(--color-border);flex-wrap:wrap;gap:16px;">
                  <span style="font-size:2rem;font-weight:900;color:var(--color-gold);">$${book.price.toFixed(2)}</span>
                  <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <a href="${pdfLink}" target="_blank" class="er-btn er-btn-outline" style="border-color:var(--color-emerald);color:var(--color-emerald);">Download PDF (Free)</a>
                    <button onclick="window.addBookToCart('${book._id}', '${book.title.replace(/'/g,"\\'")}'); window.closeBookDetails();" class="er-btn er-btn-outline">Add to Cart</button>
                    <button onclick="window.openPurchase('${book._id}','${book.title.replace(/'/g,"\\'")}',${book.price}); window.closeBookDetails();" class="er-btn er-btn-primary">Buy Now</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    } catch(err) {
      window.showToast('Failed to load book details', true);
      modal.innerHTML = '';
    }
  };

  window.closeBookDetails = function(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('er-global-book-modal');
    if (modal) modal.innerHTML = '';
  };

  // ── Global Add to Cart ────────────────────────────────────
  window.addBookToCart = async function(bookId, title) {
    const token = getToken();
    if (!token) {
      window.showToast('Please sign in to add items to cart.', true);
      setTimeout(() => { window.location.href = 'signin.html'; }, 1000);
      return;
    }
    try {
      const r = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bookId, quantity: 1 })
      });
      const d = await r.json();
      if (!d.success) throw new Error();
      window.showToast(`✓ "${title}" added to cart`);
      fetchCartCount(); // update nav badge count dynamically
    } catch { window.showToast('Failed to add to cart', true); }
  };

  // ── Global Direct Purchase Modal ──────────────────────────
  window.openPurchase = function(bookId, title, price) {
    const token = getToken();
    if (!token) {
      window.showToast('Please sign in to make a purchase.', true);
      setTimeout(() => { window.location.href = 'signin.html'; }, 1000);
      return;
    }
    let modal = document.getElementById('er-global-purchase-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'er-global-purchase-modal';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="er-modal-overlay" onclick="window.closePurchase(event)">
        <div class="er-modal-box" style="max-width:480px;" onclick="event.stopPropagation()">
          <button onclick="window.closePurchase()" class="er-modal-close">✕</button>
          <h3 style="font-size:1.3rem;font-weight:900;margin-bottom:20px;">Purchase Book</h3>
          <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:16px;margin-bottom:24px;">
            <p style="font-weight:700;margin-bottom:4px;">${title}</p>
            <p style="font-size:1.6rem;font-weight:900;color:var(--color-gold);">$${price.toFixed(2)}</p>
          </div>
          <form id="purchase-form" style="display:flex;flex-direction:column;gap:16px;">
            <div>
              <label style="font-size:.8rem;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:6px;">Full Name</label>
              <input type="text" id="purchase-name" class="er-input" required />
            </div>
            <div>
              <label style="font-size:.8rem;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:6px;">Address</label>
              <textarea id="purchase-address" rows="2" class="er-input" style="resize:none;" required></textarea>
            </div>
            <div>
              <label style="font-size:.8rem;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:6px;">Pincode</label>
              <input type="text" id="purchase-pincode" class="er-input" required />
            </div>
            <div>
              <label style="font-size:.8rem;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;display:block;">Payment Method</label>
              <div style="display:flex;gap:12px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.875rem;"><input type="radio" name="payment-method" value="UPI" /> UPI</label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.875rem;"><input type="radio" name="payment-method" value="Cash on Delivery" checked /> Cash on Delivery</label>
              </div>
            </div>
            <button type="submit" class="er-btn er-btn-primary" style="justify-content:center;padding:14px;">Complete Purchase</button>
          </form>
        </div>
      </div>`;
    modal.querySelector('#purchase-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const r = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            bookId, price,
            name: document.getElementById('purchase-name').value,
            address: document.getElementById('purchase-address').value,
            pincode: document.getElementById('purchase-pincode').value,
            paymentMethod: document.querySelector('input[name="payment-method"]:checked').value
          })
        });
        const d = await r.json();
        if (!d.success) throw new Error(d.message || 'Purchase failed');
        window.closePurchase();
        window.showToast('✓ Purchase successful! Book added to your library.');
      } catch (err) { window.showToast('Purchase failed: ' + err.message, true); }
    });
  };

  window.closePurchase = function(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('er-global-purchase-modal');
    if (modal) modal.innerHTML = '';
  };

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
