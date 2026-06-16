import type { PlateCalculation } from '@shared/contracts';

const STANDARD_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

export function calculatePlates(
  targetWeightKg: number,
  barWeightKg = 20,
  availablePlatesKg = STANDARD_PLATES_KG,
): PlateCalculation {
  const remainderPerSide = (targetWeightKg - barWeightKg) / 2;

  if (remainderPerSide <= 0) {
    return { targetWeightKg, barWeightKg, perSide: [], remainderKg: 0 };
  }

  let remaining = remainderPerSide;
  const perSide: number[] = [];

  for (const plate of [...availablePlatesKg].sort((a, b) => b - a)) {
    while (remaining >= plate - 0.01) {
      perSide.push(plate);
      remaining -= plate;
    }
  }

  return {
    targetWeightKg,
    barWeightKg,
    perSide,
    remainderKg: Math.max(0, Math.round(remaining * 100) / 100),
  };
}
