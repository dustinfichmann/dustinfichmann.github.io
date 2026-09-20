// Pure preference logic: a pair is asked once, including every self-pair.
export function createComparisons(size, random = Math.random) {
  const pairs = [];
  for (let a = 0; a < size; a++) {
    for (let b = a; b < size; b++) {
      pairs.push(a !== b && random() < 0.5 ? [b, a] : [a, b]);
    }
  }
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

function edgesFor(answers) {
  return answers.flatMap(({ a, b, choice }, index) => {
    if (choice === 'left') return [{ from: a, to: b, strict: true, index }];
    if (choice === 'right') return [{ from: b, to: a, strict: true, index }];
    if (choice === 'tie') return [
      { from: a, to: b, strict: false, index },
      { from: b, to: a, strict: false, index },
    ];
    return [];
  });
}

// A weak-preference path in the reverse direction of a strict preference
// contradicts transitivity. This also catches cycles involving indifference.
function findPath(edges, start, finish) {
  const queue = [{ node: start, path: [] }];
  const visited = new Set([start]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const { node, path } = queue[cursor];
    if (node === finish) return path;
    for (const edge of edges.filter(edge => edge.from === node)) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push({ node: edge.to, path: [...path, edge.index] });
      }
    }
  }
  return null;
}

export function findViolation(answers) {
  const missing = answers.findIndex(answer => answer.choice === 'none');
  if (missing !== -1) return { property: 'complete', witnesses: [missing] };
  const self = answers.findIndex(({ a, b, choice }) => a === b && choice !== 'tie');
  if (self !== -1) return { property: 'reflexive', witnesses: [self] };
  const edges = edgesFor(answers);
  for (const edge of edges.filter(edge => edge.strict)) {
    const path = findPath(edges, edge.to, edge.from);
    if (path) return {
      property: 'transitive',
      witnesses: [...new Set([edge.index, ...path])].sort((a, b) => a - b),
    };
  }
  return null;
}

export function rankMovies(size, answers) {
  const seen = new Set(answers.map(({ a, b }) => [Math.min(a, b), Math.max(a, b)].join(':')));
  if (seen.size !== size * (size + 1) / 2 || findViolation(answers)) {
    throw new Error('A complete, consistent set of comparisons is required.');
  }
  // In a total preorder, equally ranked movies have the same number of wins.
  const wins = Array(size).fill(0);
  for (const { a, b, choice } of answers) {
    if (choice === 'left') wins[a]++;
    if (choice === 'right') wins[b]++;
  }
  const groups = new Map();
  wins.forEach((score, movie) => {
    if (!groups.has(score)) groups.set(score, []);
    groups.get(score).push(movie);
  });
  return [...groups.entries()].sort(([a], [b]) => b - a).map(([, movies]) => movies);
}
