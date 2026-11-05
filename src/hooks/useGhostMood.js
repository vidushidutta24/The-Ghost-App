/**
 * useGhostMood — central mood state for the Ghost.
 *
 * This is the single source of truth for what the ghost is feeling.
 * Future modules (AI brain, activity tracker, system events) should
 * call `setMood(GHOST_MOODS.X)` to change the ghost's state.
 *
 * Usage:
 *   const { mood, setMood } = useGhostMood()
 */

import { useState, useCallback } from 'react'
import { GHOST_MOODS } from '../constants/moods.js'

export function useGhostMood(initial = GHOST_MOODS.NEUTRAL) {
  const [mood, setMoodRaw] = useState(initial)

  const setMood = useCallback((nextMood) => {
    if (!Object.values(GHOST_MOODS).includes(nextMood)) {
      console.warn(`[GhostMood] Unknown mood: "${nextMood}" — ignoring.`)
      return
    }
    setMoodRaw(nextMood)
  }, [])

  return { mood, setMood }
}

