import React from 'react'
import { formatDuration } from '../../services/dashboardService.js'
import { AppCategoryIcon } from './AppIcons.jsx'

export function AppUsageList({ appUsages = [], totalActiveSecs = 0 }) {
  const displayList = appUsages.length > 0 ? appUsages : []

  return (
    <div className="dashboard-card app-usage-card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">⚡</span>
          <div>
            <h3 className="card-title">App Usage</h3>
            <p className="card-subtitle">Active screen time consumed per application</p>
          </div>
        </div>
        <span className="spooky-pill pill-lavender">
          {displayList.length} Apps Tracked
        </span>
      </div>

      <div className="app-usage-list">
        {displayList.length === 0 ? (
          <div className="empty-state">
            <span className="empty-ghost">👻</span>
            <p>Observing applications... screen time will appear as you work.</p>
          </div>
        ) : (
          displayList.map((app, index) => {
            const pct = Math.max(2, Math.min(100, Math.round(app.percentage || 0)))

            return (
              <div key={app.name || index} className="app-usage-item">
                <div className="app-usage-top">
                  <div className="app-identity">
                    <span className={`app-icon-badge category-${app.category || 'tool'}`}>
                      <AppCategoryIcon type={app.icon_type || app.category} className="app-svg-icon" />
                    </span>
                    <div className="app-meta">
                      <span className="app-name">{app.name}</span>
                      {app.is_active && (
                        <span className="active-tag">● Currently Active</span>
                      )}
                    </div>
                  </div>

                  <div className="app-stats-right">
                    <span className="app-duration">{formatDuration(app.active_secs)}</span>
                    <span className="app-pct">{pct}%</span>
                  </div>
                </div>

                {/* Glowing Purple Progress Bar */}
                <div className="usage-progress-track">
                  <div
                    className={`usage-progress-fill ${app.is_active ? 'fill-active' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

