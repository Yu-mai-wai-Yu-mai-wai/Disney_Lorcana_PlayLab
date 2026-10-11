// Fisher-Yates: every order is equally likely and the input is not mutated.
// `arr.sort(() => Math.random() - 0.5)` is biased (some orders come up far more often) and its
// result depends on the browser's sort algorithm, so decks dealt that way are not fair shuffles.
export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
