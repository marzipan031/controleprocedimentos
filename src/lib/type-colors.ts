/** Índice de cor estável para um tipo, baseado na posição em que foi cadastrado. */
export function typeColorIndex(type: string, allTypes: string[]): number {
  const idx = allTypes.indexOf(type);
  return idx === -1 ? 0 : idx % 5;
}

const BADGE_CLASSES = [
  "bg-chart-1/12 text-chart-1 border-chart-1/30",
  "bg-chart-2/12 text-chart-2 border-chart-2/30",
  "bg-chart-3/12 text-chart-3 border-chart-3/30",
  "bg-chart-4/12 text-chart-4 border-chart-4/30",
  "bg-chart-5/12 text-chart-5 border-chart-5/30",
];

/** Classe Tailwind (badge) para um tipo, ciclando pelos tokens --chart-1..5. */
export function typeBadgeClass(type: string, allTypes: string[]): string {
  return BADGE_CLASSES[typeColorIndex(type, allTypes)]!;
}

/** Paleta usada nos gráficos (recharts não lê classes Tailwind, precisa de cor literal). */
export const CHART_PALETTE = [
  "hsl(211 90% 45%)",
  "hsl(174 62% 40%)",
  "hsl(261 62% 55%)",
  "hsl(28 90% 52%)",
  "hsl(340 72% 52%)",
  "hsl(150 55% 40%)",
  "hsl(200 70% 60%)",
  "hsl(45 90% 50%)",
];

export function typeChartColor(type: string, allTypes: string[]): string {
  const idx = allTypes.indexOf(type);
  const i = idx === -1 ? 0 : idx % CHART_PALETTE.length;
  return CHART_PALETTE[i]!;
}
