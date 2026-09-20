import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
function test(name, run) {
  run();
  console.log(`PASS: ${name}`);
}
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const model = await import('../preference-model.js');
const { createComparisons, findViolation, rankMovies } = model;
const answer = (a, b, choice) => ({ a, b, choice });

function allRankings(n) {
  const rows = [];
  for (let bits = 0; bits < n ** n; bits++) {
    let value = bits;
    const rank = Array.from({ length: n }, () => { const r = value % n; value = Math.floor(value / n); return r; });
    const used = new Set(rank);
    if (used.size === Math.max(...rank) + 1) rows.push(rank);
  }
  return rows;
}
function agrees(rank, { a, b, choice }) {
  return choice === 'tie' ? rank[a] === rank[b] : choice === 'left' ? rank[a] < rank[b] : rank[b] < rank[a];
}

test('28 distinct comparisons include all seven self-pairs, with shuffled order and orientation', () => {
  let seed = 42;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const pairs = createComparisons(7, random);
  assert.equal(pairs.length, 28);
  assert.equal(new Set(pairs.map(pair => [...pair].sort().join(':'))).size, 28);
  assert.equal(pairs.filter(([a, b]) => a === b).length, 7);
  assert.ok(pairs.some(([a, b]) => a > b));
  assert.notDeepEqual(pairs, createComparisons(7, random));
});

test('no opinion and both strict self-preferences stop immediately', () => {
  assert.deepEqual(findViolation([answer(0, 1, 'none')]), { property: 'complete', witnesses: [0] });
  for (const choice of ['left', 'right']) {
    assert.deepEqual(findViolation([answer(2, 2, choice)]), { property: 'reflexive', witnesses: [0] });
  }
  assert.equal(findViolation([answer(2, 2, 'tie')]), null);
});

test('detects strict cycles, mixed cycles, and inconsistent indifference without rejecting chains', () => {
  for (const choices of [
    [answer(0, 1, 'left'), answer(1, 2, 'left'), answer(2, 0, 'left')],
    [answer(0, 1, 'tie'), answer(1, 2, 'left'), answer(2, 0, 'tie')],
    [answer(0, 1, 'tie'), answer(1, 2, 'tie'), answer(0, 2, 'left')],
    [answer(0, 1, 'left'), answer(1, 2, 'tie'), answer(2, 3, 'left'), answer(3, 0, 'tie')],
  ]) {
    assert.equal(findViolation(choices.slice(0, -1)), null);
    const issue = findViolation(choices);
    assert.equal(issue.property, 'transitive');
    assert.ok(issue.witnesses.includes(choices.length - 1));
  }
  assert.equal(findViolation([answer(0, 1, 'tie'), answer(1, 2, 'tie'), answer(0, 2, 'tie')]), null);
});

test('every partial ordering of four movies agrees with an independent exhaustive oracle', () => {
  const pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  const rankings = allRankings(4);
  assert.equal(rankings.length, 75);
  for (let code = 0; code < 4 ** pairs.length; code++) {
    let state = code;
    const answers = [];
    for (const [a, b] of pairs) {
      const choice = [null, 'left', 'right', 'tie'][state % 4];
      state = Math.floor(state / 4);
      if (choice) answers.push(answer(a, b, choice));
    }
    const possible = rankings.some(rank => answers.every(row => agrees(rank, row)));
    const issue = findViolation(answers);
    assert.equal(issue === null, possible, `partial ordering ${code}`);
    if (issue) {
      const witness = issue.witnesses.map(index => answers[index]);
      assert.equal(rankings.some(rank => witness.every(row => agrees(rank, row))), false, 'evidence must itself prove the contradiction');
    }
  }
});

test('complete consistent answers produce a best-first ordering, including ties', () => {
  for (const rank of [...allRankings(4), [0, 1, 1, 2, 3, 3, 4], [0, 0, 0, 0, 0, 0, 0], [6, 5, 4, 3, 2, 1, 0]]) {
    const answers = createComparisons(rank.length).map(([a, b]) => answer(a, b, rank[a] === rank[b] ? 'tie' : rank[a] < rank[b] ? 'left' : 'right'));
    for (let i = 1; i <= answers.length; i++) assert.equal(findViolation(answers.slice(0, i)), null);
    const expected = [...new Set(rank)].sort((a, b) => a - b).map(r => rank.flatMap((value, i) => value === r ? [i] : []));
    assert.deepEqual(rankMovies(rank.length, answers), expected);
  }
  assert.throws(() => rankMovies(3, []));
});

// Exercise the UI controller without a browser or external dependencies.
function fixture(controller) {
  class Element {
    constructor() {
      this.listeners = {}; this.attributes = {}; this.dataset = {}; this.children = []; this.textContent = ''; this.hidden = true;
      this.classes = new Set();
      this.classList = { add: c => this.classes.add(c), remove: c => this.classes.delete(c), toggle: (c, on) => on ? this.classes.add(c) : this.classes.delete(c) };
    }
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
    fire(type, extra = {}) { const event = { target: this, preventDefault() {}, ...extra }; for (const fn of this.listeners[type] ?? []) fn(event); }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    removeAttribute(k) { delete this.attributes[k]; }
    focus() { document.activeElement = this; }
    replaceChildren() { this.children = []; }
    append(child) { this.children.push(child); }
  }
  const selectors = ['[data-quiz-question]', '[data-quiz-result]', '[data-quiz-progress]', '#quiz-question-title', '#quiz-result-title', '[data-quiz-evidence]', '[data-evidence-title]', '[data-quiz-restart]'];
  const elements = Object.fromEntries(selectors.map(s => [s, new Element()]));
  const choices = Object.fromEntries(['left', 'right', 'tie', 'none'].map(choice => {
    const button = new Element(); button.dataset.choice = choice;
    const strong = new Element(); button.querySelector = () => strong;
    elements[`[data-choice="${choice}"]`] = button;
    return [choice, button];
  }));
  const launch = new Element();
  const closers = [new Element(), new Element()];
  const dialog = new Element(); dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  dialog.querySelector = selector => elements[selector];
  dialog.querySelectorAll = selector => selector === '[data-choice]' ? Object.values(choices) : closers;
  dialog.getBoundingClientRect = () => ({ left: 10, top: 10, right: 600, bottom: 500 });
  const document = {
    querySelector: selector => selector === '[data-quiz-launch]' ? launch : dialog,
    querySelectorAll: () => Array.from({ length: 7 }, (_, i) => ({ childNodes: [{ nodeType: 3, textContent: `Movie ${i}` }] })),
    createElement: () => new Element(), documentElement: new Element(), activeElement: null,
  };
  const window = new Element();
  vm.runInNewContext(controller.replace(/^import .*;\n/, ''), { ...model, document, window, Node: { TEXT_NODE: 3 } });
  return { launch, dialog, elements, choices, closers, document, window };
}
const controller = await readFile(new URL('preference-quiz.js', root), 'utf8');

test('quiz outcomes, close routes, and restart leave no previous answers or result', () => {
  const f = fixture(controller);
  const progress = f.elements['[data-quiz-progress]'];
  const title = f.elements['#quiz-result-title'];
  const evidence = f.elements['[data-quiz-evidence]'];
  for (const close of [
    () => f.closers[0].fire('click'),
    () => f.closers[1].fire('click'),
    () => f.dialog.fire('cancel'),
    () => { f.dialog.fire('pointerdown', { clientX: 0, clientY: 0 }); f.dialog.fire('click', { clientX: 0, clientY: 0 }); },
    () => f.window.fire('pagehide'),
  ]) {
    f.launch.fire('click'); assert.equal(progress.textContent, '1 / 28');
    f.choices.none.fire('click');
    assert.match(title.textContent, /not complete/); assert.equal(evidence.children.length, 1);
    f.choices.none.fire('click'); assert.equal(evidence.children.length, 1, 'finished quiz ignores further choices');
    close();
    assert.equal(f.dialog.open, false); assert.equal(evidence.children.length, 0); assert.equal(title.textContent, '');
    assert.equal(f.document.activeElement, f.launch);
    assert.equal(f.document.documentElement.classes.has('quiz-open'), false);
  }
  f.launch.fire('click');
  f.choices.none.fire('click');
  f.elements['[data-quiz-restart]'].fire('click');
  assert.equal(progress.textContent, '1 / 28'); assert.equal(title.textContent, ''); assert.equal(evidence.children.length, 0);
  for (let i = 0; i < 28; i++) f.choices.tie.fire('click');
  assert.match(title.textContent, /complete, transitive and reflexive/);
  assert.equal(evidence.children.length, 1);
  assert.equal(evidence.children[0].textContent.split(' ∼ ').length, 7);
  f.elements['[data-quiz-restart]'].fire('click');
  for (let i = 0; i < 28; i++) {
    const a = Number(f.choices.left.querySelector('strong').textContent.slice(-1));
    const b = Number(f.choices.right.querySelector('strong').textContent.slice(-1));
    f.choices[a === b ? 'tie' : a < b ? 'left' : 'right'].fire('click');
  }
  assert.equal(evidence.children.length, 7);
  assert.deepEqual(evidence.children.map(item => item.textContent), Array.from({ length: 7 }, (_, i) => `Movie ${i}`));
});
