'use strict';
// City filters progressively enhance the complete list of coffee shops.
document.querySelectorAll('[data-collection]').forEach(collection => {
  const buttons = collection.querySelectorAll('[data-filter]');
  const places = collection.querySelectorAll('[data-category]');
  const count = collection.querySelector('[data-count]');
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let visible = 0;
    places.forEach(place => {
      place.hidden = button.dataset.filter !== 'all' && place.dataset.category !== button.dataset.filter;
      if (!place.hidden) visible++;
    });
    count.textContent = `${visible} ${visible === 1 ? 'place' : 'places'}`;
  }));
});

// Reveal personal links on mouse hover, or pin them open with click/tap.
document.querySelectorAll('.nav-group').forEach(group => {
  const toggle = group.querySelector('.nav-group-heading');
  const menu = group.querySelector('.subnav');
  let pinned = false;
  const show = expanded => {
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.querySelector('.nav-disclosure').textContent = expanded ? '−' : '+';
    menu.hidden = !expanded;
  };
  toggle.addEventListener('click', () => {
    pinned = !pinned;
    show(pinned);
  });
  group.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') show(true);
  });
  group.addEventListener('pointerleave', () => {
    if (!pinned && !menu.contains(document.activeElement)) show(false);
  });
  group.addEventListener('focusout', event => {
    if (!group.contains(event.relatedTarget)) {
      pinned = false;
      show(false);
    }
  });
  group.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      pinned = false;
      show(false);
      toggle.focus();
    }
  });
});

// On phones, expose the same navigation through a tap-friendly disclosure.
// Without JavaScript the regular navigation stays visible.
document.querySelectorAll('.sidebar').forEach(sidebar => {
  const toggle = sidebar.querySelector('.mobile-menu-toggle');
  const nav = sidebar.querySelector('#primary-navigation');
  const smallScreen = window.matchMedia('(max-width: 760px)');
  const setOpen = expanded => {
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.querySelector('[data-menu-label]').textContent = expanded ? 'Close' : 'Menu';
    toggle.querySelector('[data-menu-symbol]').textContent = expanded ? '−' : '+';
    sidebar.classList.toggle('mobile-nav-open', expanded);
    if (!expanded && smallScreen.matches && sidebar.contains(document.activeElement)) {
      toggle.focus();
    }
  };
  toggle.hidden = false;
  sidebar.classList.add('mobile-nav-ready');
  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  sidebar.addEventListener('keydown', event => {
    if (event.key === 'Escape' && smallScreen.matches && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (smallScreen.matches && toggle.getAttribute('aria-expanded') === 'true' && !sidebar.contains(event.target)) {
      setOpen(false);
    }
  });
  smallScreen.addEventListener('change', () => {
    setOpen(false);
    if (!smallScreen.matches && document.activeElement === toggle) {
      nav.querySelector('a[aria-current="page"]:not(.subnav-link), a').focus();
    }
  });
});
