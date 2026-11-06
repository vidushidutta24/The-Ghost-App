import React from 'react'
import { formatDuration } from '../../services/dashboardService.js'
import { AppCategoryIcon } from './AppIcons.jsx'

export function RunningAppsSection({ runningApps = [] }) {
  return (
    <div className="dashboard-card running-apps-card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">🔮</span>
          <div>
            <h3 className="card-title">Currently Running Applications</h3>
            <p className="card-subtitle">Live processes observed on your Fedora desktop</p>
          </div>
        </div>
        <div className="pulse-count-badge">
          <span className="live-pulse-dot" />
          <span>{runningApps.length} Active Processes</span>
        </div>
      </div>

      <div className="running-apps-grid">
        {runningApps.length === 0 ? (
          <div className="empty-state">
            <span className="empty-ghost">🕯️</span>
            <p>Scanning desktop processes... all silent.</p>
          </div>
        ) : (
          runningApps.map((app) => {
            const isActive = app.is_active
            const isMedia = app.category === 'media'

            return (
              <div
                key={app.name}
                className={`running-app-tile ${isActive ? 'tile-active' : ''} ${isMedia ? 'tile-media' : ''}`}
              >
                <div className="tile-top">
                  <div className="tile-icon-box">
                    <AppCategoryIcon type={app.icon_type || app.category} className="app-svg-icon" />
                  </div>
                  <div className="tile-status-badge">
                    {isActive ? (
                      <span className="status-pill status-focused">
                        <span className="status-dot" /> Focused
                      </span>
                    ) : isMedia ? (
                      <span className="status-pill status-media">
                        <span className="status-dot-pulse" /> Playing
                      </span>
                    ) : (
                      <span className="status-pill status-bg">
                        <span className="status-dot-dim" /> Background
                      </span>
                    )}
                  </div>
                </div>

                <div className="tile-content">
                  <h4 className="tile-app-name">{app.name}</h4>
                  <div className="tile-time-row">
                    <span className="tile-clock-icon">⏳</span>
                    <span className="tile-time-label">
                      {app.active_secs > 0 ? formatDuration(app.active_secs) : 'Just started'}
                    </span>
                  </div>
                </div>

                {isActive && <div className="tile-neon-border" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

