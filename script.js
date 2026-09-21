/* ==========================================================================
   IPTVNetworkHub — shared site script
   Loaded by every page (index.html, channels.html, contact.html, privacy.html,
   terms.html). Everything here is defensive: if a page does not contain the
   element a block looks for, that block simply does nothing.

   Contents:
     1. Mobile navigation drawer
     2. Swiper arrow controls
     3. FAQ accordion behaviour
     4. Current-year stamps
     5. Active-page navigation highlighting
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Mobile navigation drawer
     ---------------------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.querySelector('.menu-toggle');
    var menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(!menu.classList.contains('open'));
    });

    // Close after following a link inside the drawer
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });

    // Close as soon as the visitor scrolls the page. A wheel event can fire
    // without producing a scroll (at the very top of the page, or inside a
    // non-scrollable area), so it is used only as a fallback while the menu
    // is actually open — the scroll itself is the primary trigger.
    window.addEventListener('scroll', function () {
      if (menu.classList.contains('open')) setOpen(false);
    }, { passive: true });

    window.addEventListener('wheel', function () {
      if (menu.classList.contains('open')) setOpen(false);
    }, { passive: true });

    // Close when a click/tap lands anywhere outside the drawer and its
    // toggle button, so the menu does not stay open behind the content.
    document.addEventListener('pointerdown', function (e) {
      if (!menu.classList.contains('open')) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });

    // Close on Escape, and return focus to the toggle
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close if the viewport grows back to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 920 && menu.classList.contains('open')) {
        setOpen(false);
      }
    });
  }

  /* ------------------------------------------------------------------------
     2. Swiper arrow controls (index.html channel / movie strips)
     ---------------------------------------------------------------------- */
  function initSwipers() {
    var buttons = document.querySelectorAll('.swiper-btn');
    if (!buttons.length) return;

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var track = document.getElementById(btn.dataset.target);
        if (!track) return;
        var amount = track.clientWidth * 0.8;
        track.scrollBy({
          left: btn.classList.contains('prev') ? -amount : amount,
          behavior: 'smooth'
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. FAQ accordion
     Native <details>/<summary> already toggles without JavaScript, so this is
     purely an enhancement. Each .faq group can opt into "only one open at a
     time" with the data-accordion attribute; without it, items behave like
     normal <details> elements and several can stay open at once.
     ---------------------------------------------------------------------- */
  function initFaq() {
    var groups = document.querySelectorAll('.faq');
    if (!groups.length) return;

    var reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Smoothly animate an answer open/closed. The native toggle stays the
    // source of truth: without JS (or with reduced motion) the item simply
    // snaps, which is the correct fallback.
    function animatePanel(item, expanding) {
      var panel = item.querySelector('p');
      if (!panel || reducedMotion) return;

      var startHeight = panel.offsetHeight;
      panel.style.overflow = 'hidden';

      if (expanding) {
        // Measure the natural height, then grow to it.
        panel.style.height = '0px';
        var endHeight = panel.scrollHeight;
        // Force a reflow so the browser commits the 0px start value.
        void panel.offsetHeight;
        panel.style.transition = 'height .28s ease, opacity .28s ease';
        panel.style.height = endHeight + 'px';
        panel.style.opacity = '1';
        window.setTimeout(function () { cleanup(panel); }, 300);
      } else {
        panel.style.height = startHeight + 'px';
        void panel.offsetHeight;
        panel.style.transition = 'height .28s ease, opacity .28s ease';
        panel.style.height = '0px';
        panel.style.opacity = '0';
        window.setTimeout(function () { cleanup(panel); }, 300);
      }

      function cleanup(el) {
        el.style.transition = '';
        el.style.height = '';
        el.style.overflow = '';
        el.style.opacity = '';
      }
    }

    Array.prototype.forEach.call(groups, function (group) {
      var items = group.querySelectorAll('details.faq-item');
      if (!items.length) return;

      // Keyboard: move focus between questions with the arrow keys, and
      // jump to the first/last with Home/End.
      var list = Array.prototype.slice.call(items);

      // Optional single-open behaviour
      if (group.hasAttribute('data-accordion')) {
        Array.prototype.forEach.call(items, function (item) {
          item.addEventListener('toggle', function () {
            if (!item.open) return;
            Array.prototype.forEach.call(items, function (other) {
              if (other !== item && other.open) other.open = false;
            });
          });
        });
      }

      // Deep-linking: opening a FAQ item keeps the URL in sync, and a
      // #faq-item-id in the URL opens the matching answer on load.
      Array.prototype.forEach.call(items, function (item, index) {
        var summary = item.querySelector('summary');
        if (!summary) return;

        if (!item.id) item.id = 'faq-item-' + (index + 1);

        // Animate the answer when the item opens or closes.
        item.addEventListener('toggle', function () {
          animatePanel(item, item.open);
        });

        summary.addEventListener('click', function () {
          // Let the browser apply the open/closed state first.
          window.setTimeout(function () {
            if (item.open) {
              if (history.replaceState) {
                history.replaceState(null, '', '#' + item.id);
              }
            } else if (location.hash === '#' + item.id) {
              if (history.replaceState) {
                history.replaceState(null, '', location.pathname + location.search);
              }
            }
          }, 0);
        });

        // Keyboard: move focus between questions with the arrow keys, and
        // jump to the first/last with Home/End.
        summary.addEventListener('keydown', function (e) {
          var i = list.indexOf(item);
          if (i === -1) return;

          var target = null;
          if (e.key === 'ArrowDown') target = list[(i + 1) % list.length];
          else if (e.key === 'ArrowUp') target = list[(i - 1 + list.length) % list.length];
          else if (e.key === 'Home') target = list[0];
          else if (e.key === 'End') target = list[list.length - 1];
          if (!target) return;

          e.preventDefault();
          var ts = target.querySelector('summary');
          if (ts) ts.focus();
        });
      });
    });

    // Open the item named in the URL hash. Runs on load and again on later
    // hash changes, and is deferred so it still applies if the fragment is
    // set after DOMContentLoaded (e.g. a same-page link or the browser
    // restoring a hash on reload).
    function openFromHash() {
      var hash = location.hash;
      if (!hash || hash.indexOf('#faq-item-') !== 0) return;
      var target = document.getElementById(hash.slice(1));
      if (target && target.tagName === 'DETAILS') {
        target.open = true;
      }
    }

    openFromHash();
    window.requestAnimationFrame(openFromHash);
    window.addEventListener('hashchange', openFromHash);

    // A link such as href="#some-faq-id" should open that answer, not just
    // scroll to it.
    document.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#faq-item-"]') : null;
      if (!link) return;
      var target = document.querySelector(link.getAttribute('href'));
      if (target && target.tagName === 'DETAILS') target.open = true;
    });
  }

  /* ------------------------------------------------------------------------
     4. Current-year stamps
     ---------------------------------------------------------------------- */
  function initYear() {
    var nodes = document.querySelectorAll('[data-year]');
    if (!nodes.length) return;
    var year = new Date().getFullYear();
    Array.prototype.forEach.call(nodes, function (node) {
      node.textContent = year;
    });
  }

  /* ------------------------------------------------------------------------
     5. Active-page navigation highlighting
     Marks the navigation link for the page being viewed, so the shared
     navigation markup can be reused verbatim on every page.
     ---------------------------------------------------------------------- */
  function initActiveNav() {
    // Resolve a URL path to a canonical form so that a page compares as the
    // same destination however it is linked. The implicit "index.html" of a
    // directory and any trailing "/" are stripped, so "/" and "/index.html"
    // (or "/guides/" and "/guides") match. Flat pages such as
    // "/iptv-guides.html" and "/what-is-iptv.html" keep their filename and are
    // compared directly.
    function canonicalPath(pathname) {
      var path = pathname.replace(/index\.html$/i, '');
      if (path.length > 1) {
        path = path.replace(/\/+$/, '');
      }
      return path || '/';
    }

    var here = canonicalPath(location.pathname);

    var links = document.querySelectorAll('.nav-links a, .nav-mobile a');
    Array.prototype.forEach.call(links, function (link) {
      var href = link.getAttribute('href');
      if (!href || href.indexOf('#') === 0) return;

      // Only a link with no hash fragment points AT a page. Links such as
      // "index.html#pricing" point at a section of a page, so marking them
      // would flag most of the navigation on every page.
      if (href.indexOf('#') !== -1) return;

      // Ignore links that are really just a call to action
      if (link.classList.contains('btn')) return;

      // Resolve the link relative to the current document before comparing,
      // so relative links such as "index.html" and "iptv-guides.html" are
      // handled correctly.
      var resolved;
      try {
        resolved = canonicalPath(new URL(href, location.href).pathname);
      } catch (err) {
        return;
      }

      if (resolved === here) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ------------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  function init() {
    initMobileNav();
    initSwipers();
    initFaq();
    initYear();
    initActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
