import type { ActivityKey } from '@shared/constants/activities';
import type { IconType } from 'react-icons';
import {
  MdDirectionsBike,
  MdDirectionsRun,
  MdDownhillSkiing,
  MdFitnessCenter,
  MdHiking,
  MdKayaking,
  MdPool,
  MdRowing,
  MdSelfImprovement,
  MdSnowboarding,
  MdSurfing,
  MdTerrain,
} from 'react-icons/md';
import { PiBoxingGlove, PiFlame, PiPersonSimpleTaiChi } from 'react-icons/pi';

export const ACTIVITY_META_ICONS: Record<ActivityKey, IconType> = {
  gym:       MdFitnessCenter,
  run:       MdDirectionsRun,
  cycle:     MdDirectionsBike,
  hike:      MdHiking,
  swim:      MdPool,
  row:       MdRowing,
  ski:       MdDownhillSkiing,
  snowboard: MdSnowboarding,
  climb:     MdTerrain,
  surf:      MdSurfing,
  kayak:     MdKayaking,
  yoga:      MdSelfImprovement,
  boxing:    PiBoxingGlove,
  stretch:   PiPersonSimpleTaiChi,
  hiit:      PiFlame,
};
