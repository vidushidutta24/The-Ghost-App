/**
 * sessionManager.js — Reads the persistent session snapshot from the Rust
 * backend and enriches it with browser-local-timezone display fields.
 *
 * Pipeline:
 *   Rust SessionStore (disk) → get_session_snapshot command
 *   → raw SessionSnapshot (Unix timestamps)
 *   → computeWelcomeContext() (JS, timezone-aware)
 *   → WelcomeContext (what the Ghost UI consumes)
 *
 * Separation of concerns:
 *   - Rust owns persistence and timestamp arithmetic
 *   - JS owns local-time display logic (time_of_day, is_first_of_day)
 *   - Ghost UI owns what message to show
 */

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} WelcomeContext
 * @property {boolean} isFirstSession   - Very first ever launch
 * @property {boolean} isFirstOfDay     - First session of the calendar day
 * @property {number|null} awayDurationSecs          - Seconds since last session ended
 * @property {number|null} previousSessionDurationSecs - How long the last session was
 * @property {number} currentSessionStartedAt        - Unix secs this session began
 * @property {'morning'|'afternoon'|'evening'|'night'} timeOfDay
 * @property {number} totalSessions     - All-time session count
 */

// ─── Context derivation ───────────────────────────────────────────────────────

function getTimeOfDay(hour) {
  if (hour >= 5  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function isSameLocalDay(unixMsA, unixMsB) {
  const a = new Date(unixMsA)
  const b = new Date(unixMsB)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

/**
 * Enrich a raw SessionSnapshot (from Rust) into a WelcomeContext.
 * All timezone-sensitive logic lives here, using the browser's local clock.
 *
 * @param {object} snapshot - SessionSnapshot from get_session_snapshot command
 * @returns {WelcomeContext}
 */
function computeWelcomeContext(snapshot) {
  const nowMs  = Date.now()
  const hour   = new Date().getHours()

  const awayDurationSecs = snapshot.last_session_end_secs != null
    ? Math.max(0, Math.round(nowMs / 1000 - snapshot.last_session_end_secs))
    : null

  const isFirstOfDay = !snapshot.is_first_session && snapshot.last_session_end_secs != null
    ? !isSameLocalDay(snapshot.last_session_end_secs * 1000, nowMs)
    : false

  return {
    isFirstSession:              snapshot.is_first_session,
    isFirstOfDay,
    awayDurationSecs,
    previousSessionDurationSecs: snapshot.last_session_duration_secs ?? null,
    currentSessionStartedAt:     snapshot.current_session_started_at,
    timeOfDay:                   getTimeOfDay(hour),
    totalSessions:               snapshot.total_sessions,
  }
}

// ─── Mock for browser dev mode ────────────────────────────────────────────────

function mockContext() {
  const hour = new Date().getHours()
  return {
    isFirstSession:              false,
    isFirstOfDay:                false,
    awayDurationSecs:            3 * 3600 + 24 * 60,  // 3h 24m — for preview
    previousSessionDurationSecs: 2 * 3600,
    currentSessionStartedAt:     Math.floor(Date.now() / 1000),
    timeOfDay:                   getTimeOfDay(hour),
    totalSessions:               7,
  }
}

// ─── React hook ───────────────────────────────────────────────────────────────

/**
 * useSessionContext — returns the WelcomeContext once it's ready, null before.
 *
 * Usage:
 *   const ctx = useSessionContext()
 *   if (!ctx) return <Loading />
 *   const msg = generateWelcomeMessage(ctx)
 */
export function useSessionContext() {
  const [context, setContext] = useState(null)

  useEffect(() => {
    invoke('get_session_snapshot')
      .then(snapshot => setContext(computeWelcomeContext(snapshot)))
      .catch(() => {
        console.info('[sessionManager] Tauri not available — using mock session')
        setContext(mockContext())
      })
  }, [])

  return context
}

