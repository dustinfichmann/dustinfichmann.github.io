import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const script = await readFile(new URL('../script.js', import.meta.url), 'utf8');

function fixture() {
  class Element {
    constructor(parent = null) {
      this.parent = parent;
      this.listeners = {};
      this.attrs = {};
      this.classes = new Set();
      this.hidden = true;
      this.textContent = '';
      this.classList = {
        add: value => this.classes.add(value),
        toggle: (value, enabled) => enabled ? this.classes.add(value) : this.classes.delete(value),
      };
    }
    addEventListener(event, fn) { (this.listeners[event] ??= []).push(fn); }
    fire(event, data = {}) {
      const e = { target: this, stopPropagation() { this.stopped = true; }, ...data };
      for (const fn of this.listeners[event] ?? []) fn(e);
      return e;
    }
    contains(element) { return element === this || Boolean(element?.parent && this.contains(element.parent)); }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    getAttribute(name) { return this.attrs[name]; }
    focus() { document.activeElement = this; }
  }
  const document = new Element();
  const sidebar = new Element();
  const nav = new Element(sidebar);
  const firstLink = new Element(nav);
  nav.querySelector = () => firstLink;
  const toggle = new Element(sidebar);
  toggle.setAttribute('aria-expanded', 'false');
  const label = new Element(toggle);
  const symbol = new Element(toggle);
  toggle.querySelector = key => key === '[data-menu-label]' ? label : symbol;
  sidebar.querySelector = key => key === '.mobile-menu-toggle' ? toggle : nav;
  const group = new Element(nav);
  const subToggle = new Element(group);
  const subMenu = new Element(group);
  const subLink = new Element(subMenu);
  subToggle.setAttribute('aria-expanded', 'false');
  subToggle.querySelector = () => new Element();
  group.querySelector = key => key === '.nav-group-heading' ? subToggle : subMenu;
  document.querySelectorAll = key => key === '.sidebar' ? [sidebar] : key === '.nav-group' ? [group] : [];
  const media = new Element(); media.matches = true;
  const window = { matchMedia: query => { assert.equal(query, '(max-width: 760px)'); return media; } };
  vm.runInNewContext(script, { document, window });
  return { document, sidebar, nav, toggle, label, symbol, group, subToggle, subMenu, subLink, media, firstLink };
}
function test(name, run) { run(); console.log(`PASS: ${name}`); }

test('menu starts collapsed and opens and closes with a tap', () => {
  const f = fixture();
  assert.equal(f.toggle.hidden, false);
  assert.ok(f.sidebar.classes.has('mobile-nav-ready'));
  assert.equal(f.sidebar.classes.has('mobile-nav-open'), false);
  f.toggle.fire('click');
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(f.label.textContent, 'Close');
  assert.ok(f.sidebar.classes.has('mobile-nav-open'));
  f.toggle.fire('click');
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(f.label.textContent, 'Menu');
});

test('personal pages stay collapsed until tapped and Escape closes the inner menu first', () => {
  const f = fixture();
  f.toggle.fire('click');
  assert.equal(f.subMenu.hidden, true);
  f.subToggle.fire('click');
  assert.equal(f.subMenu.hidden, false);
  f.subLink.focus();
  const event = f.group.fire('keydown', { key: 'Escape' });
  assert.equal(event.stopped, true);
  assert.equal(f.subMenu.hidden, true);
  assert.equal(f.document.activeElement, f.subToggle);
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'true');
  f.sidebar.fire('keydown', { key: 'Escape' });
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(f.document.activeElement, f.toggle);
});

test('outside taps dismiss the mobile menu, while inside taps do not', () => {
  const f = fixture();
  f.toggle.fire('click');
  f.document.fire('pointerdown', { target: f.nav });
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'true');
  f.firstLink.focus();
  f.document.fire('pointerdown', { target: {} });
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(f.document.activeElement, f.toggle);
});

test('resizing between desktop and mobile clears the menu state and preserves reachable focus', () => {
  const f = fixture();
  f.toggle.fire('click'); f.toggle.focus();
  f.media.matches = false; f.media.fire('change');
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(f.document.activeElement, f.firstLink);
  f.media.matches = true; f.media.fire('change');
  assert.equal(f.sidebar.classes.has('mobile-nav-open'), false);
  assert.equal(f.document.activeElement, f.toggle);
});
