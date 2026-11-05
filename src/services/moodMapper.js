/**
 * moodMapper.js — Maps Ghost context → Ghost mood.
 *
 * Pure function module. No React, no Tauri.
 * Architectural pipeline:
 *   Activity Monitor → Context → Ghost State / Mood → Expression
 *
 * The Ghost acts as an observant companion:
 * - Everyday desktop tasks (terminal, browsing, unknown apps) keep the Ghost
 *   in a calm, watching "neutral" state.
 * - Engaged focus activities (coding, music) perk the Ghost into "happy".
 * - Inactivity (idle) lets the Ghost drift into "sleepy".
 * - Long unbroken work sessions (long_session) shift into "sad" (concerned/tired).
 *
 * Mood ← Context mapping:
 *   coding       → happy
 *   music        → happy
 *   terminal     → neutral
 *   browsing     → neutral
 *   idle         → sleepy
 *   unknown      → neutral
 *   long_session → sad
 */

import { GHOST_MOODS } from '../constants/moods.js'
import { CONTEXTS, deriveContext } from './contextMapper.js'

/** The mapping table. Maps desktop context to Ghost Mood. */
const CONTEXT_TO_MOOD = {
  [CONTEXTS.CODING]:       GHOST_MOODS.HAPPY,
  [CONTEXTS.MUSIC]:        GHOST_MOODS.HAPPY,
  [CONTEXTS.TERMINAL]:     GHOST_MOODS.NEUTRAL,
  [CONTEXTS.BROWSING]:     GHOST_MOODS.NEUTRAL,
  [CONTEXTS.IDLE]:         GHOST_MOODS.SLEEPY,
  [CONTEXTS.LONG_SESSION]: GHOST_MOODS.SAD,
  [CONTEXTS.UNKNOWN]:      GHOST_MOODS.NEUTRAL,
}

/**
 * Map a context string to the appropriate Ghost mood.
 *
 * @param {string} context - one of CONTEXTS values
 * @returns {string} - one of GHOST_MOODS values
 */
export function contextToMood(context) {
  return CONTEXT_TO_MOOD[context] ?? GHOST_MOODS.NEUTRAL
}

/**
 * Convenience: go straight from ActivityState to mood.
 * Useful when you don't need the intermediate context.
 *
 * @param {object} activity - ActivityState
 * @param {function} deriveCtx - optional override for deriveContext
 * @returns {string} - Ghost mood
 */
export function activityToMood(activity, deriveCtx) {
  const ctx = deriveCtx ? deriveCtx(activity) : deriveContext(activity)
  return contextToMood(ctx)
}
