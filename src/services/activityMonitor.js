/**
 * activityMonitor.js — Listens to Tauri's "activity-update" events and
 * exposes the latest activity state to the rest of the app.
 *
 * Usage:
 *   import { useActivityState } from './services/activityMonitor.js'
 *   const activity = useActivityState()   // { context, application, idle, ... }
 *
 * The Rust backend (src-tauri/src/activity.rs) emits the event every 5 s.
 * Falls back gracefully in browser-dev mode (no Tauri runtime).
 */

import { useEffect, useState } from 'react'

/** Default state before the first event arrives. */
const DEFAULT_STATE = {
  context: 'unknown',
  application: '',
  duration: 0,
  idle: false,
  idle_secs: 0,
  timestamp: 0,
  long_session: false,
}

/**
 * React hook — returns the latest ActivityState from the Rust monitor.
 * Re-renders whenever a new event arrives.
 */
export function useActivityState() {
  const [state, setState] = useState(DEFAULT_STATE)

  useEffect(() => {
    let unlisten = null

    async function subscribe() {
      try {
        // Dynamic import so the module doesn't crash in browser-dev mode
        const { listen } = await import('@tauri-apps/api/event')
        unlisten = await listen('activity-update', (event) => {
          setState(event.payload)
        })
      } catch {
        // Running in browser — emit a fake update every 5 s for dev convenience
        console.info('[activityMonitor] Tauri not available, using mock state')
        setState({ ...DEFAULT_STATE, context: 'coding', application: 'Browser Dev' })
      }
    }

    subscribe()

    return () => {
      if (typeof unlisten === 'function') unlisten()
    }
  }, [])

  return state
}

