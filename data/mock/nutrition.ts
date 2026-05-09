import type { Id } from '@shared/types';
import type { NutritionEntryView } from '@features/nutrition';

function makeSeedEntries(): NutritionEntryView[] {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const h = (hour: number) => start + hour * 3_600_000;
  return [
    { id: 'seed-n1' as Id<'NutritionEntry'>, category: 'meal', name: 'Oats & blueberries', notes: '', time: '07:30', macros: { kcal: 350, proteinG: 12, carbsG: 58, fatG: 7 }, loggedAt: h(7.5) },
    { id: 'seed-n2' as Id<'NutritionEntry'>, category: 'water', name: '250', notes: '', time: '08:00', macros: null, loggedAt: h(8) },
    { id: 'seed-n3' as Id<'NutritionEntry'>, category: 'vitamin', name: 'Vitamin D3', notes: '', time: '08:05', macros: null, loggedAt: h(8.1) },
    { id: 'seed-n4' as Id<'NutritionEntry'>, category: 'snack', name: 'Banana', notes: '', time: '10:30', macros: { kcal: 89, proteinG: 1, carbsG: 23, fatG: 0 }, loggedAt: h(10.5) },
    { id: 'seed-n5' as Id<'NutritionEntry'>, category: 'water', name: '300', notes: '', time: '11:00', macros: null, loggedAt: h(11) },
    { id: 'seed-n6' as Id<'NutritionEntry'>, category: 'meal', name: 'Chicken breast & rice', notes: '', time: '13:00', macros: { kcal: 580, proteinG: 48, carbsG: 65, fatG: 10 }, loggedAt: h(13) },
    { id: 'seed-n7' as Id<'NutritionEntry'>, category: 'water', name: '650', notes: '', time: '13:30', macros: null, loggedAt: h(13.5) },
    { id: 'seed-n8' as Id<'NutritionEntry'>, category: 'supplement', name: 'Creatine 5g', notes: '', time: '16:00', macros: null, loggedAt: h(16) },
    { id: 'seed-n9' as Id<'NutritionEntry'>, category: 'water', name: '250', notes: '', time: '16:15', macros: null, loggedAt: h(16.25) },
  ];
}

export const MOCK_NUTRITION_ENTRIES: NutritionEntryView[] = makeSeedEntries();
