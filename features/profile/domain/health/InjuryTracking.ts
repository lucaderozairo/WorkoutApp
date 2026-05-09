export type InjuryEntry = {
  id: string;
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  startDate: string;
  resolvedDate?: string;
};
