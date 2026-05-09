import { describe, it, expect } from 'vitest';
import { parseMfpCsv } from './nutrition';

const MFP_CSV = `Date,Meal,Calories,Carbohydrates,Fat,Protein,Fiber,Sugar,Sodium,Cholesterol
2026-04-20,Breakfast,420,52,14,22,6,12,380,55
2026-04-20,Lunch,680,70,24,38,9,8,820,90
2026-04-20,Dinner,550,60,18,32,7,10,640,75
2026-04-20,Snacks,210,28,8,10,3,18,150,0
`;

describe('parseMfpCsv', () => {
  it('returns one entry per non-header row', () => {
    expect(parseMfpCsv(MFP_CSV).length).toBe(4);
  });

  it('maps Meal to NutritionCategory correctly', () => {
    const entries = parseMfpCsv(MFP_CSV);
    expect(entries[0].category).toBe('meal');
    expect(entries[3].category).toBe('snack');
  });

  it('parses kcal from Calories column', () => {
    expect(parseMfpCsv(MFP_CSV)[0].macros!.kcal).toBe(420);
  });

  it('parses protein, carbs, fat', () => {
    const m = parseMfpCsv(MFP_CSV)[1].macros!;
    expect(m.proteinG).toBe(38);
    expect(m.carbsG).toBe(70);
    expect(m.fatG).toBe(24);
  });

  it('parses fiber, sugar, sodium, cholesterol', () => {
    const m = parseMfpCsv(MFP_CSV)[0].macros!;
    expect(m.fiberG).toBe(6);
    expect(m.sugarG).toBe(12);
    expect(m.sodiumMg).toBe(380);
    expect(m.cholesterolMg).toBe(55);
  });

  it('sets name to the Meal value', () => {
    expect(parseMfpCsv(MFP_CSV)[0].name).toBe('Breakfast');
  });

  it('uses the Date column as time (HH:MM defaults to 00:00)', () => {
    expect(parseMfpCsv(MFP_CSV)[0].time).toBe('00:00');
  });

  it('ignores rows where Calories is 0 or blank', () => {
    const csv = `Date,Meal,Calories,Carbohydrates,Fat,Protein,Fiber,Sugar,Sodium,Cholesterol
2026-04-20,Breakfast,0,0,0,0,0,0,0,0
2026-04-20,Totals,1860,210,64,102,25,48,1990,220
`;
    expect(parseMfpCsv(csv).length).toBe(0);
  });
});
