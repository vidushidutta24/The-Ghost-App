/**
 * Ghost moods and character states.
 * Designed for easy extension by future AI / Activity Detection modules.
 */

export const GHOST_MOODS = {
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  SAD: 'sad',
  ANGRY: 'angry',
  SURPRISED: 'surprised',
  SLEEPY: 'sleepy',
}

export const MOOD_CONFIG = {
  [GHOST_MOODS.NEUTRAL]: {
    id: GHOST_MOODS.NEUTRAL,
    label: 'Neutral',
    emoji: '😐',
    animation: 'float',
    description: 'Calm, watching, and observant',
  },
  [GHOST_MOODS.HAPPY]: {
    id: GHOST_MOODS.HAPPY,
    label: 'Happy',
    emoji: '😊',
    animation: 'bounce',
    description: 'Content and floating cheerfully',
  },
  [GHOST_MOODS.SAD]: {
    id: GHOST_MOODS.SAD,
    label: 'Sad',
    emoji: '😢',
    animation: 'droop',
    description: 'Drooping gently with melancholy',
  },
  [GHOST_MOODS.ANGRY]: {
    id: GHOST_MOODS.ANGRY,
    label: 'Angry',
    emoji: '😠',
    animation: 'agitated',
    description: 'Puffed up with stern determination',
  },
  [GHOST_MOODS.SURPRISED]: {
    id: GHOST_MOODS.SURPRISED,
    label: 'Surprised',
    emoji: '😲',
    animation: 'perky',
    description: 'Wide-eyed and alert',
  },
  [GHOST_MOODS.SLEEPY]: {
    id: GHOST_MOODS.SLEEPY,
    label: 'Sleepy',
    emoji: '😴',
    animation: 'drowsy',
    description: 'Drifting off to sleep with zzz',
  },
}

export const ALL_MOODS = Object.values(GHOST_MOODS)
