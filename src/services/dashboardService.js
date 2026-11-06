/**
 * dashboardService.js — Real-time stats and controls for Digital Ghost Dashboard.
 *
 * Subscribes to live Linux desktop metrics:
 *   - System uptime
 *   - Session duration, active screen time, idle time
 *   - Application usage breakdown with percentages
 *   - Currently running desktop applications with active/background status
 *   - 24-hour hourly screen time graph
 */

import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

export function formatDuration(secs) {
  if (secs == null || isNaN(secs) || secs < 0) return '0m'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  if (m > 0) {
    return `${m}m`
  }
  return `${s}s`
}

export function formatClockTime(unixSecs) {
  if (!unixSecs) return ''
  const date = new Date(unixSecs * 1000)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const DEFAULT_HOURLY = Array.from({ length: 24 }, (_, i) => {
  const isPm = i >= 12
  const num = i === 0 ? 12 : i > 12 ? i - 12 : i
  const label = `${num} ${isPm ? 'PM' : 'AM'}`
  return {
    hour: i,
    label,
    active_secs: 0,
    idle_secs: 0,
    is_current_hour: new Date().getHours() === i,
  }
})

const DEFAULT_DASHBOARD_DATA = {
  uptime_secs: 5400,
  boot_timestamp: Math.floor(Date.now() / 1000) - 5400,
  session_start_secs: Math.floor(Date.now() / 1000) - 3600,
  session_duration_secs: 3600,
  active_usage_secs: 3120,
  idle_usage_secs: 480,
  current_active_app: 'Visual Studio Code',
  current_context: 'coding',
  is_idle: false,
  idle_duration_secs: 0,
  total_tracked_active_secs: 3120,
  app_usages: [
    {
      name: 'Visual Studio Code',
      category: 'code',
      icon_type: 'code',
      active_secs: 2100,
      percentage: 67.3,
      is_running: true,
      is_active: true,
      status: 'Active · Focused',
    },
    {
      name: 'Google Chrome',
      category: 'browser',
      icon_type: 'browser',
      active_secs: 620,
      percentage: 19.8,
      is_running: true,
      is_active: false,
      status: 'Running in Background',
    },
    {
      name: 'Terminal',
      category: 'terminal',
      icon_type: 'terminal',
      active_secs: 400,
      percentage: 12.9,
      is_running: true,
      is_active: false,
      status: 'Running in Background',
    },
  ],
  running_apps: [
    {
      name: 'Visual Studio Code',
      category: 'code',
      icon_type: 'code',
      active_secs: 2100,
      percentage: 67.3,
      is_running: true,
      is_active: true,
      status: 'Active · Focused',
    },
    {
      name: 'Google Chrome',
      category: 'browser',
      icon_type: 'browser',
      active_secs: 620,
      percentage: 19.8,
      is_running: true,
      is_active: false,
      status: 'Running in Background',
    },
    {
      name: 'Terminal',
      category: 'terminal',
      icon_type: 'terminal',
      active_secs: 400,
      percentage: 12.9,
      is_running: true,
      is_active: false,
      status: 'Running in Background',
    },
  ],
  hourly_stats: DEFAULT_HOURLY,
}

export function useDashboardData() {
  const [data, setData] = useState(DEFAULT_DASHBOARD_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unlisten = null

    // 1. Initial snapshot from Rust
    invoke('get_dashboard_data')
      .then((res) => {
        if (res) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.info('[Dashboard] Using default state in preview mode:', err)
        setLoading(false)
      })

    // 2. Real-time updates every 5s from background monitor
    async function listenToUpdates() {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        unlisten = await listen('dashboard-update', (event) => {
          if (event.payload) {
            setData(event.payload)
          }
        })
      } catch (err) {
        console.info('[Dashboard] Live event subscription unavailable in browser:', err)
      }
    }

    listenToUpdates()

    return () => {
      if (typeof unlisten === 'function') {
        unlisten()
      }
    }
  }, [])

  const openDashboardWindow = useCallback(async () => {
    try {
      await invoke('open_dashboard')
    } catch {
      window.location.hash = '#dashboard'
    }
  }, [])

  const closeDashboardWindow = useCallback(async () => {
    try {
      await invoke('close_dashboard')
    } catch {
      window.location.hash = ''
    }
  }, [])

  return {
    data,
    loading,
    openDashboardWindow,
    closeDashboardWindow,
  }
}

