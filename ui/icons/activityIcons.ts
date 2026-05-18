import type { SportType } from '@features/training_log/domain/types';
import type { IconType } from 'react-icons';

// Material Design (react-icons/md) — activity-specific icons
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
  MdSportsMma,
  MdSurfing,
  MdTerrain,
} from 'react-icons/md';

// Phosphor (react-icons/pi) — fills gaps where MD has no specific icon
import {
  PiBarbell,
  PiBicycle,
  PiBoxingGlove,
  PiFlame,
  PiMedal,
  PiPersonSimple,
  PiPersonSimpleCircle,
  PiPersonSimpleRun,
  PiPersonSimpleSki,
  PiPersonSimpleTaiChi,
  PiQuestion,
  PiShuffle,
  PiStack,
  PiStairs,
  PiTimer,
} from 'react-icons/pi';

export interface ActivityIconDef {
  label: string;
  Icon: IconType;
}

export const ACTIVITY_ICONS: Record<SportType, ActivityIconDef> = {
  // Outdoor endurance
  run:             { label: 'Run',           Icon: MdDirectionsRun   },
  cycle:           { label: 'Cycle',         Icon: MdDirectionsBike    },
  swim:            { label: 'Swim',          Icon: MdPool              },
  row:             { label: 'Row',           Icon: MdRowing            },
  hike:            { label: 'Hike',          Icon: MdHiking            },
  ski:             { label: 'Ski',           Icon: MdDownhillSkiing    },
  snowboard:       { label: 'Snowboard',     Icon: MdSnowboarding      },
  kayak:           { label: 'Kayak',         Icon: MdKayaking          },
  surf:            { label: 'Surf',          Icon: MdSurfing           },
  climb:           { label: 'Climb',         Icon: MdTerrain           },
  // Gym cardio machines
  ski_erg:         { label: 'Ski Erg',       Icon: PiPersonSimpleSki   },
  assault_bike:    { label: 'Assault Bike',  Icon: MdDirectionsBike    },
  air_bike:        { label: 'Air Bike',      Icon: PiBicycle           },
  concept2_rower:  { label: 'C2 Rower',      Icon: MdRowing            },
  treadmill:       { label: 'Treadmill',     Icon: PiPersonSimpleRun   },
  stair_climber:   { label: 'Stair Climber', Icon: PiStairs            },
  elliptical:      { label: 'Elliptical',    Icon: PiPersonSimpleCircle},
  // Gym / structured
  strength:        { label: 'Gym',           Icon: MdFitnessCenter     },
  hiit:            { label: 'HIIT',          Icon: PiFlame             },
  yoga:            { label: 'Yoga',          Icon: MdSelfImprovement   },
  stretch:         { label: 'Stretch',       Icon: PiPersonSimpleTaiChi},
  mobility:        { label: 'Mobility',      Icon: PiPersonSimpleCircle},
  boxing:          { label: 'Boxing',        Icon: PiBoxingGlove       },
  // Named multi-sport events
  triathlon:       { label: 'Triathlon',     Icon: PiMedal             },
  duathlon:        { label: 'Duathlon',      Icon: PiMedal             },
  hyrox:           { label: 'Hyrox',         Icon: MdSportsMma         },
  obstacle_course: { label: 'Obstacle',      Icon: MdTerrain           },
  // Generic / structural
  multi:           { label: 'Multi-Sport',   Icon: PiStack             },
  transition:      { label: 'Transition',    Icon: PiShuffle           },
  other:           { label: 'Other',         Icon: PiQuestion          },
};

export function getActivityIcon(sport: SportType): IconType {
  return ACTIVITY_ICONS[sport]?.Icon ?? PiPersonSimple;
}

export function getActivityLabel(sport: SportType): string {
  return ACTIVITY_ICONS[sport]?.label ?? sport;
}
