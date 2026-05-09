import type { NutritionEntry, NutritionCategory } from '@features/nutrition/domain/types';
import type { Id } from '@shared/types';

function mealToCategory(meal: string): NutritionCategory {
  const lower = meal.toLowerCase();
  if (lower === 'snacks') return 'snack';
  return 'meal';
}

const SKIP_MEALS = new Set(['totals', 'total', 'daily totals']);

export function parseMfpCsv(csv: string): NutritionEntry[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const col = (row: string[], name: string) =>
    row[headers.indexOf(name)]?.trim() ?? '';

  const entries: NutritionEntry[] = [];
  const now = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const meal = col(row, 'meal');
    if (SKIP_MEALS.has(meal.toLowerCase())) continue;

    const kcal = parseFloat(col(row, 'calories') || '0');
    if (!kcal) continue;

    entries.push({
      id:       `mfp-${i}` as Id<'NutritionEntry'>,
      userId:   'import' as Id<'User'>,
      category: mealToCategory(meal),
      name:     meal,
      notes:    '',
      time:     '00:00',
      loggedAt: now,
      macros: {
        kcal,
        carbsG:       parseFloat(col(row, 'carbohydrates') || '0'),
        fatG:         parseFloat(col(row, 'fat')           || '0'),
        proteinG:     parseFloat(col(row, 'protein')       || '0'),
        fiberG:       parseFloat(col(row, 'fiber')         || '0') || undefined,
        sugarG:       parseFloat(col(row, 'sugar')         || '0') || undefined,
        sodiumMg:     parseFloat(col(row, 'sodium')        || '0') || undefined,
        cholesterolMg:parseFloat(col(row, 'cholesterol')   || '0') || undefined,
      },
    });
  }

  return entries;
}
