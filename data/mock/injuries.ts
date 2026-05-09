export type InjurySeverity = 'mild' | 'moderate' | 'severe';
export type InjuryStatus = 'active' | 'monitoring' | 'recovered';

export interface MockInjury {
  id: string;
  bodyPart: string;
  description: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  onsetDate: string;
  notes: string;
}

export const MOCK_INJURIES: MockInjury[] = [
  {
    id: 'inj-1',
    bodyPart: 'Left knee',
    description: 'Patellar tendinopathy',
    severity: 'mild',
    status: 'monitoring',
    onsetDate: '2026-03-10',
    notes: 'Avoid heavy leg press. Squats OK with reduced load.',
  },
  {
    id: 'inj-2',
    bodyPart: 'Right shoulder',
    description: 'Rotator cuff impingement',
    severity: 'mild',
    status: 'monitoring',
    onsetDate: '2026-02-20',
    notes: 'Overhead pressing limited to 60%. No behind-the-neck work.',
  },
];
