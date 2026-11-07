// Saison du calendrier du ranch (la lumière et le ciel sont dans ciel.ts).

export function saison(jour: number) {
  const s = ['Printemps', 'Été', 'Automne', 'Hiver'];
  return s[Math.floor(((jour - 1) % 32) / 8)];
}
