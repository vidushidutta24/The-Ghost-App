import React, { useState } from 'react'
import { useDashboardData } from '../../services/dashboardService.js'
import { GhostHeroSection } from './GhostHeroSection.jsx'
import { SessionStatsCards } from './SessionStatsCards.jsx'
import { ScreenTimeGraph } from './ScreenTimeGraph.jsx'
import { AppUsageList } from './AppUsageList.jsx'
import { RunningAppsSection } from './RunningAppsSection.jsx'
import roomBg from '../../assets/room-bg.jpg'
import '../../styles/dashboard.css'

export default function Dashboard({ onClose }) {
  const { data, loading, closeDashboardWindow } = useDashboardData()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      closeDashboardWindow()
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
        setIsFullscreen(false)
      }
    }
  }

  const mood = data.is_idle
    ? 'sleepy'
    : data.current_context === 'coding' || data.current_context === 'music'
    ? 'happy'
    : 'neutral'

  return (
    <div className="spooky-dashboard-root" data-tauri-drag-region>
      {/* ── 1. Atmospheric Layers (Moonlight, Room Backdrop, Fog & Mist) ── */}
      <div
        className="dashboard-bg-image"
        style={{ backgroundImage: `url(${roomBg})` }}
      />
      <div className="dashboard-vignette-overlay" />
      <div className="dashboard-moonlight-glow" />
      <div className="dashboard-fog-layer fog-layer-1" />
      <div className="dashboard-fog-layer fog-layer-2" />

      {/* Floating Ghost Embers / Particles */}
      <div className="ghost-embers-field">
        <span className="ember ember-1" />
        <span className="ember ember-2" />
        <span className="ember ember-3" />
        <span className="ember ember-4" />
        <span className="ember ember-5" />
        <span className="ember ember-6" />
      </div>

      {/* ── 2. Top Header Bar ── */}
      <header className="dashboard-top-nav" data-tauri-drag-region>
        <div className="nav-brand" data-tauri-drag-region>
          <span className="brand-ghost-icon">👻</span>
          <div className="brand-text">
            <h1 className="brand-title">DIGITAL GHOST</h1>
            <span className="brand-tagline">Sanctuary & Screen Time Control Center</span>
          </div>
        </div>

        <div className="nav-center-status">
          <span className="nav-pulse-dot" />
          <span className="nav-status-text">
            {data.is_idle
              ? 'Ghost Resting · Inactive'
              : data.current_active_app
              ? `Watching ${data.current_active_app}`
              : 'Observing Desktop'}
          </span>
        </div>

        <div className="nav-actions">
          <button
            className="spooky-nav-btn btn-fullscreen"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⤢' : '⤡'}
          </button>

          <button
            className="spooky-nav-btn btn-return-desktop"
            onClick={handleClose}
            title="Return to desktop (keeps floating Ghost alive)"
          >
            <span className="return-icon">✦</span>
            <span>Back to Desktop</span>
          </button>
        </div>
      </header>

      {/* ── 3. Main Dashboard Scrollable Content ── */}
      <main className="dashboard-main-content">
        {/* Ghost Hero Chamber */}
        <section className="dashboard-section section-hero">
          <GhostHeroSection
            mood={mood}
            currentApp={data.current_active_app}
            sessionDurationSecs={data.session_duration_secs}
            activeSecs={data.active_usage_secs}
            uptimeSecs={data.uptime_secs}
          />
        </section>

        {/* Laptop Screen Time & Session Metrics Grid */}
        <section className="dashboard-section section-metrics">
          <SessionStatsCards
            sessionDurationSecs={data.session_duration_secs}
            sessionStartSecs={data.session_start_secs}
            uptimeSecs={data.uptime_secs}
            activeSecs={data.active_usage_secs}
            idleSecs={data.idle_usage_secs}
            weeklyTotalSecs={data.weekly_total_secs}
            dailyAverageSecs={data.daily_average_secs}
            todayTotalSecs={data.today_total_secs}
            currentApp={data.current_active_app}
            isIdle={data.is_idle}
          />
        </section>

        {/* 2-Column Grid: Screen Time Graph (Left) & App Usage (Right) */}
        <section className="dashboard-section section-charts-grid">
          <div className="charts-col-left">
            <ScreenTimeGraph
              weeklyStats={data.weekly_stats}
              weeklyTotalSecs={data.weekly_total_secs}
              weeklyActiveSecs={data.weekly_active_secs}
              weeklyIdleSecs={data.weekly_idle_secs}
              dailyAverageSecs={data.daily_average_secs}
              todayTotalSecs={data.today_total_secs}
              hourlyStats={data.hourly_stats}
              activeTotalSecs={data.active_usage_secs}
              idleTotalSecs={data.idle_usage_secs}
            />
          </div>

          <div className="charts-col-right">
            <AppUsageList
              appUsages={data.app_usages}
              totalActiveSecs={data.active_usage_secs}
            />
          </div>
        </section>

        {/* Currently Running Applications Section */}
        <section className="dashboard-section section-running-apps">
          <RunningAppsSection runningApps={data.running_apps} />
        </section>

        {/* Spooky Footer Note */}
        <footer className="dashboard-footer">
          <p className="footer-whisper">
            ✦ Digital Ghost · Fedora Linux Companion · Watching quietly from the digital ether ✦
          </p>
        </footer>
      </main>
    </div>
  )
}

