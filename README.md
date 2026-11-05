# 👻 Digital Ghost

> **A tiny AI entity that lives on your desktop.**

Digital Ghost is an AI-powered desktop companion designed to feel less like an application and more like a **little digital creature that lives inside your computer**.

It has a personality, moods, memory, animations, and awareness of basic desktop activity. Instead of opening another chatbot window, you simply have a small pixel-art ghost existing alongside your everyday workflow.

---

## ✨ What is Digital Ghost?

Digital Ghost is a **desktop AI companion** built for Linux/Fedora using **Tauri + React**.

The Ghost can:

- 👻 Live as a transparent floating desktop character
- 👀 React to your activity
- 🖱️ Respond to mouse movement and inactivity
- 🪟 Detect which application is currently active
- ⏱️ Track activity duration
- 🧠 Remember selected information locally
- 🎭 Change moods and expressions
- 💬 Talk and respond to the user
- 🤖 Use AI for conversations and personality
- 🔔 React to selected system events
- 🎨 Animate between different pixel-art states

The goal isn't to build another chatbot.

The goal is to create something that feels **alive**.

---

## 🧠 The Core Idea

Instead of:

```text
User → Opens ChatGPT → Talks → Closes ChatGPT
```

Digital Ghost works more like:

```text
                 ┌──────────────────┐
                 │      Fedora      │
                 └────────┬─────────┘
                          │
                    Desktop Activity
                          │
                          ▼
                 ┌──────────────────┐
                 │ Activity Engine  │
                 └────────┬─────────┘
                          │
                  "User is coding"
                          │
                          ▼
                 ┌──────────────────┐
                 │   Digital Ghost  │
                 │                  │
                 │   👀  → curious  │
                 │   😴  → idle     │
                 │   🤯  → chaotic  │
                 │   ❤️  → happy    │
                 └────────┬─────────┘
                          │
                          ▼
                     AI / Memory
```

The computer becomes the Ghost's environment.

---

# 🧩 Features

## 👻 Desktop Presence

Digital Ghost runs as a **transparent, frameless desktop application**.

Instead of looking like a conventional application window, the Ghost can simply float over your desktop.

```text
┌─────────────────────────────────────────────┐
│                                             │
│             VS CODE                         │
│                                             │
│                          👻                 │
│                       "Still coding?"       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 👀 Activity Awareness

The Ghost can observe **non-sensitive activity metadata** from the desktop.

For example:

- Current active application
- Mouse activity
- Idle time
- Session duration
- Selected system events

This allows it to understand the user's **general context** without needing to inspect private content.

Example:

```text
Active application: VS Code
Session duration: 47 minutes
User activity: Active
```

The Ghost can interpret this as:

> **"User is probably coding."**

---

## 🎭 Mood System

The Ghost has an internal state that controls its appearance and behavior.

Possible moods:

```text
happy
sad
sleepy
angry
excited
curious
bored
chaotic
confused
```

For example:

```text
User inactive for 30 minutes
        ↓
      😴
        ↓
Ghost becomes sleepy
```

Or:

```text
Long coding session
        ↓
      👀
        ↓
"Bro. You've been coding for two hours."
```

---

## 🧠 Memory

Digital Ghost can maintain a **local memory system**.

Memory could contain things such as:

```text
Preferences
 ├── Favorite music
 ├── Preferred personality
 └── Favorite Ghost reactions

Projects
 ├── Current project
 ├── Project status
 └── Important milestones

Interactions
 ├── Previous conversations
 └── Significant events
```

The intention is to make the Ghost feel like it **knows you over time**, rather than resetting after every session.

---

## 🤖 AI Personality

The AI isn't just used to answer questions.

It acts as the Ghost's **brain**.

It can determine:

- What the Ghost should say
- How the Ghost should react
- What mood it should have
- Whether an event is worth reacting to
- How previous memories affect its response

For example:

```text
User opens VS Code
        ↓
Activity Engine
        ↓
Coding detected
        ↓
Ghost personality
        ↓
"Back to Java again? 😭"
```

---

## 🎨 Pixel-Art Character

The Ghost uses a pixel-art visual style with animated expressions.

Different states can have their own animation frames:

```text
assets/
├── idle/
├── happy/
├── sad/
├── sleepy/
├── angry/
├── excited/
└── chaotic/
```

This allows the Ghost to visually communicate without needing to speak every time.

---

# 🏗️ Architecture

```text
                         DIGITAL GHOST
                              │
                 ┌────────────┴────────────┐
                 │                         │
              Frontend                 Native Layer
                 │                         │
              React                      Tauri
                 │                         │
       ┌─────────┼─────────┐              │
       │         │         │              │
     UI      Animation   State          Rust
       │         │         │              │
       └─────────┴─────────┘       ┌──────┴──────┐
                                    │             │
                                Linux APIs    System Events
                                    │
                                    ▼
                             Activity Engine
                                    │
                                    ▼
                              Memory System
                                    │
                                    ▼
                                  AI
```

---

# 🛠️ Tech Stack

### Frontend

- React
- JavaScript / TypeScript
- HTML
- CSS

### Desktop

- Tauri
- Rust

### AI

Can be connected to:

- Local LLMs
- Gemini
- OpenAI-compatible APIs
- Other AI providers

The AI layer is intentionally modular so the Ghost doesn't have to depend on one provider.

### Storage

Local storage / SQLite can be used for:

- Memories
- Preferences
- Activity history
- Ghost state

### Platform

Primary target:

**Fedora Linux**

Potential future support:

- Windows
- macOS
- Other Linux distributions

---

# 🔐 Privacy

Digital Ghost is designed around a **privacy-first approach**.

The Ghost should only collect the minimum information required for its behavior.

### By default, it should NOT secretly collect:

- ❌ Passwords
- ❌ Keystrokes
- ❌ Private messages
- ❌ Screenshots
- ❌ Microphone recordings
- ❌ Personal files
- ❌ Browser contents

Instead, it can work primarily with metadata such as:

```text
Current application → VS Code
Activity → Active
Duration → 42 minutes
```

The user should always be able to see and control what the Ghost can access.

---

# 🚀 Development Roadmap

## Phase 1 — The Ghost

- [ ] Create Tauri project
- [ ] Add transparent window
- [ ] Add pixel-art Ghost
- [ ] Remove window decorations
- [ ] Make Ghost draggable

## Phase 2 — Bring It Alive

- [ ] Idle animation
- [ ] Blinking
- [ ] Eye movement
- [ ] Multiple expressions
- [ ] Mood system

## Phase 3 — Desktop Awareness

- [ ] Detect active application
- [ ] Detect idle time
- [ ] Track activity duration
- [ ] Detect selected system events

## Phase 4 — Memory

- [ ] Local memory database
- [ ] User preferences
- [ ] Conversation history
- [ ] Long-term memory
- [ ] Memory management UI

## Phase 5 — AI Brain

- [ ] AI conversation
- [ ] Personality system
- [ ] Context-aware responses
- [ ] Mood → AI behavior integration
- [ ] Memory → AI context integration

## Phase 6 — Voice

- [ ] Speech recognition
- [ ] Text-to-speech
- [ ] Wake word
- [ ] Voice commands

## Phase 7 — Full Digital Creature

- [ ] Learned activity patterns
- [ ] More complex emotions
- [ ] System notifications
- [ ] Context-aware reactions
- [ ] Custom personalities
- [ ] Ghost customization

---

# 💡 Example Interactions

### Coding

```text
Ghost detects VS Code
        ↓
"You've been coding for 2 hours."
        ↓
👀
"Please remember that humans require food."
```

### Inactivity

```text
No activity for 20 minutes
        ↓
Ghost becomes sleepy
        ↓
😴
```

### Long session

```text
VS Code active
       ↓
3 hours
       ↓
Ghost:
"Are we building software or becoming software?"
```

### Music

```text
Spotify becomes active
       ↓
Ghost changes mood
       ↓
🎵
"Okay, this one is actually good."
```

---

# 🌱 Future Possibilities

Digital Ghost could eventually become more than a desktop pet.

Possible future features:

- 🧬 Personality evolution
- 🗺️ Activity timeline
- 📈 Personal productivity insights
- 🎮 Mini-games with the Ghost
- 🏠 Multiple Ghost environments
- 🎨 Custom Ghost skins
- 🧠 Local AI mode
- 🗣️ Full voice conversations
- 🌐 Optional cross-device memory
- 🧑‍🤝‍🧑 Multiple Ghosts with different personalities

---

# 🎯 Project Philosophy

Digital Ghost isn't designed to replace productivity tools or become another dashboard.

It's designed around a simpler idea:

> **What if your computer had a little personality?**

Something that sits quietly in the corner.

Sometimes helps.

Sometimes annoys you.

Sometimes says something completely unnecessary.

And slowly becomes **your little digital companion**.

---

## 👻 Status

**Early Development**

Currently in the concept / architecture stage.

The first milestone is getting the pixel-art Ghost running as a transparent floating Tauri application on Fedora.

---

## 📜 License

To be decided.
