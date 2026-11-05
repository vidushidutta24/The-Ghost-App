/**
 * welcomeMessages.js — Generates Ghost welcome messages from WelcomeContext.
 *
 * Pure function module. No React, no Tauri.
 * Eventually: AI personality generates these lines.
 * For now: rule-based, with Ghost's voice baked in.
 *
 * Ghost personality traits encoded here:
 *   - Lowercase, minimal punctuation
 *   - Laconic — says the minimum needed
 *   - Slightly sarcastic when you've been gone a long time
 *   - Genuinely warm on first use / morning greetings
 *   - Doesn't react to trivial away times (< 2 min)
 */

// ─── Duration formatting ──────────────────────────────────────────────────────

/**
 * Format a duration in seconds into a human-readable string.
 * e.g. 95 → "1m 35s", 3720 → "1h 2m", 86400 → "24h"
 */
export function formatDuration(secs) {
  if (secs == null) return ''
  if (secs < 60) return `${secs}s`
  if (secs < 3600) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(secs / 3600)
  const m = Math.round((secs % 3600) / 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ─── Message generation ───────────────────────────────────────────────────────

/**
 * Generate a welcome message from a WelcomeContext.
 *
 * Returns null when no message is appropriate (e.g. trivial away time).
 * Returns { primary, secondary? } where secondary is an optional second line.
 *
 * @param {import('./sessionManager').WelcomeContext} ctx
 * @returns {{ primary: string, secondary?: string } | null}
 */
export function generateWelcomeMessage(ctx) {
  if (!ctx) return null

  // ── First ever launch ─────────────────────────────────────────────────────
  if (ctx.isFirstSession) {
    return {
      primary:   'hello.',
      secondary: "i've been waiting to exist.",
    }
  }

  // ── First session of this calendar day ───────────────────────────────────
  if (ctx.isFirstOfDay) {
    switch (ctx.timeOfDay) {
      case 'morning':
        return {
          primary:   'good morning.',
          secondary: 'ready to cause problems?',
        }
      case 'afternoon':
        return {
          primary:   'good afternoon.',
          secondary: 'you slept in.',
        }
      case 'evening':
        return {
          primary:   'evening.',
          secondary: 'starting late.',
        }
      case 'night':
        return {
          primary:   "you're back.",
          secondary: "it's late.",
        }
    }
  }

  // ── Returning within the same day ─────────────────────────────────────────
  const away = ctx.awayDurationSecs

  // Quick return (< 1 minute, e.g. quick app relaunch or quick desk return)
  if (away == null || away < 60) {
    return {
      primary: 'back already?',
      secondary: away != null ? `gone for only ${away}s.` : 'just woke up.',
    }
  }

  // Under 15 minutes
  if (away < 900) {
    return {
      primary: 'back already?',
      secondary: `away for ${formatDuration(away)}.`,
    }
  }

  // 15 minutes to 2 hours
  if (away < 7200) {
    return {
      primary:   'welcome back.',
      secondary: `${formatDuration(away)} away.`,
    }
  }

  // 2 hours to 8 hours
  if (away < 28800) {
    return {
      primary: "you're back.",
      secondary: `you were gone for ${formatDuration(away)}.`,
    }
  }

  // 8+ hours
  return {
    primary:   "oh. you're back.",
    secondary: `you were gone for ${formatDuration(away)}.`,
  }
}

/**
 * Map a welcome context to the Ghost mood the welcome scene should open with.
 * This overrides the activity monitor during the brief welcome moment.
 *
 * @param {import('./sessionManager').WelcomeContext} ctx
 * @returns {string} - GHOST_MOODS value
 */
export function welcomeMood(ctx) {
  if (!ctx) return 'happy'
  if (ctx.isFirstSession) return 'happy'
  if (ctx.isFirstOfDay && ctx.timeOfDay === 'morning') return 'happy'
  if (ctx.awayDurationSecs != null && ctx.awayDurationSecs >= 28800) return 'surprised'
  return 'happy' // Always look cheerful to see the user when waking up!
}

