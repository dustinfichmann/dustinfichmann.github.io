import { createComparisons, findViolation, rankMovies } from './preference-model.js';

const launch = document.querySelector('[data-quiz-launch]');
const dialog = document.querySelector('#preference-quiz');
const movies = [...document.querySelectorAll('.film-list h3 a')].map(link =>
  [...link.childNodes].filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent).join('').trim()
);
const question = dialog.querySelector('[data-quiz-question]');
const result = dialog.querySelector('[data-quiz-result]');
const progress = dialog.querySelector('[data-quiz-progress]');
const heading = dialog.querySelector('#quiz-question-title');
const resultTitle = dialog.querySelector('#quiz-result-title');
const evidence = dialog.querySelector('[data-quiz-evidence]');
const evidenceHeading = dialog.querySelector('[data-evidence-title]');
const left = dialog.querySelector('[data-choice="left"]');
const right = dialog.querySelector('[data-choice="right"]');
let pairs = [];
let answers = [];
let finished = false;
let backdropPress = false;

function reset() {
  pairs = [];
  answers = [];
  finished = false;
  backdropPress = false;
  evidence.replaceChildren();
  resultTitle.textContent = '';
  progress.textContent = '';
  evidenceHeading.textContent = '';
  left.querySelector('strong').textContent = '';
  right.querySelector('strong').textContent = '';
  left.removeAttribute('aria-label');
  right.removeAttribute('aria-label');
  question.hidden = true;
  result.hidden = true;
  dialog.removeAttribute('data-outcome');
}

function renderQuestion() {
  const [a, b] = pairs[answers.length];
  progress.textContent = `${answers.length + 1} / ${pairs.length}`;
  left.querySelector('strong').textContent = movies[a];
  right.querySelector('strong').textContent = movies[b];
  left.setAttribute('aria-label', `Strictly prefer ${movies[a]} to ${movies[b]}`);
  right.setAttribute('aria-label', `Strictly prefer ${movies[b]} to ${movies[a]}`);
  question.hidden = false;
  result.hidden = true;
  dialog.setAttribute('aria-labelledby', 'quiz-question-title');
  heading.focus();
}

function start() {
  reset();
  pairs = createComparisons(movies.length);
  if (!dialog.open) dialog.showModal();
  document.documentElement.classList.add('quiz-open');
  renderQuestion();
}

function close() {
  if (dialog.open) dialog.close();
  reset();
  document.documentElement.classList.remove('quiz-open');
  launch.focus();
}

function describe({ a, b, choice }) {
  if (choice === 'none') return `No opinion: ${movies[a]} vs. ${movies[b]}`;
  if (choice === 'tie') return `${movies[a]} ∼ ${movies[b]}`;
  return choice === 'left' ? `${movies[a]} ≻ ${movies[b]}` : `${movies[b]} ≻ ${movies[a]}`;
}

function showResult(violation) {
  finished = true;
  question.hidden = true;
  result.hidden = false;
  dialog.dataset.outcome = violation ? 'warning' : 'success';
  progress.textContent = `${answers.length} / ${pairs.length}`;
  resultTitle.textContent = violation
    ? `Caution!! Your preferences are not ${violation.property}! Proceed with caution!`
    : 'Congrats! Your preferences are complete, transitive and reflexive!';
  evidenceHeading.textContent = violation ? 'Your choices' : 'Your preference ordering';
  evidence.classList.toggle('quiz-ranking', !violation);
  if (violation) {
    for (const index of violation.witnesses) {
      const item = document.createElement('li');
      const answer = answers[index];
      item.textContent = describe(answer);
      item.setAttribute('aria-label', item.textContent.replace(' ≻ ', ' is strictly preferred to ').replace(' ∼ ', ' is indifferent to '));
      evidence.append(item);
    }
  } else {
    for (const group of rankMovies(movies.length, answers)) {
      const item = document.createElement('li');
      item.textContent = group.map(index => movies[index]).join(' ∼ ');
      item.setAttribute('aria-label', group.map(index => movies[index]).join(', tied with '));
      evidence.append(item);
    }
  }
  dialog.setAttribute('aria-labelledby', 'quiz-result-title');
  resultTitle.focus();
}

dialog.querySelectorAll('[data-choice]').forEach(button => {
  button.addEventListener('click', () => {
    if (!dialog.open || finished || !pairs.length) return;
    const [a, b] = pairs[answers.length];
    answers.push({ a, b, choice: button.dataset.choice });
    const violation = findViolation(answers);
    if (violation || answers.length === pairs.length) showResult(violation);
    else renderQuestion();
  });
});
dialog.querySelectorAll('[data-quiz-close]').forEach(button => button.addEventListener('click', close));
dialog.querySelector('[data-quiz-restart]').addEventListener('click', start);
dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
function outside(event) {
  const rect = dialog.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}
dialog.addEventListener('pointerdown', event => { backdropPress = event.target === dialog && outside(event); });
dialog.addEventListener('click', event => {
  if (backdropPress && event.target === dialog && outside(event)) close();
  backdropPress = false;
});
// Discard everything on navigation, including pages restored from back/forward cache.
window.addEventListener('pagehide', close);
launch.addEventListener('click', start);
launch.hidden = false;
