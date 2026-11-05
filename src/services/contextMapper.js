/**
 * contextMapper.js — Maps raw ActivityState → a named Ghost context.
 *
 * This is a pure function module with no React or Tauri dependencies.
 * Future AI/personality modules can override or augment this mapping.
 *
 * Contexts (matches what the Rust backend emits):
 *   coding | terminal | browsing | music | idle | unknown
 *
 * Additionally synthesises "long_session" from the ActivityState flag.
 */

/**
 * All valid context strings the app understands.
 * Keep in sync with the Rust classifier in activity.rs.
 */
export const CONTEXTS = {
  CODING:       'coding',
  TERMINAL:     'terminal',
  BROWSING:     'browsing',
  MUSIC:        'music',
  IDLE:         'idle',
  LONG_SESSION: 'long_session',  // synthesised, not emitted by Rust directly
  UNKNOWN:      'unknown',
}

/**
 * Derive the effective Ghost context from an ActivityState payload.
 *
 * @param {object} activity - ActivityState from activityMonitor
 * @returns {string} - one of CONTEXTS values
 */
export function deriveContext(activity) {
  if (!activity) return CONTEXTS.UNKNOWN

  // Long session takes priority over other contexts (ghost should look tired/concerned)
  if (activity.long_session && !activity.idle) {
    return CONTEXTS.LONG_SESSION
  }

  // Explicit idle
  if (activity.idle) {
    return CONTEXTS.IDLE
  }

  // Trust the Rust classifier for everything else
  const ctx = activity.context
  if (Object.values(CONTEXTS).includes(ctx)) {
    return ctx
  }

  return CONTEXTS.UNKNOWN
}

