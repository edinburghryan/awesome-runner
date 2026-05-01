# Awesome Runner — Product Specification

## Overview

A mobile-first PWA training planner for ultramarathon preparation. Provides a weekly planning workspace where Ly can view, adapt, and track workouts seeded from the 80/20 Running training plan, supplemented with custom activities.

**Users:** Ly (primary), Ryan (secondary)
**Live URL:** https://edinburghryan.github.io/awesome-runner/
**Repo:** github.com/edinburghryan/awesome-runner

---

## Core Workflow

1. Open app → see today's workout(s) highlighted + race countdown in header
2. End of week → navigate to next week (auto-seeded from reference plan)
3. Review seeded workouts, modify as needed: rename, move between days, replace, add custom activities
4. Through the week → mark workouts done
5. Optionally plan multiple weeks ahead using the date picker for race prep

---

## Features

### 1. My Week (Primary View)

- **Week navigation:** ← / → arrows for prev/next week, plus a **date picker** (tap the week label) to jump to any week
- **"Today" button** in header to snap back to current week
- **Day cards** (Mon–Sun, scrollable):
  - Day name + date
  - Workout card(s) showing: type icon, title, duration, done checkbox
  - "+" button to add workouts
  - "Clear day" button (bin icon) with confirmation dialog — removes all workouts from that day
- **Today highlighted** with a blue border
- **Plan week indicator** — shows which reference plan week maps to the viewed week (e.g. "Plan Wk 5")

### 2. Workout Cards

- Tap the **checkbox** → toggles done/not-done
- Tap the **workout info** → opens detail modal with:
  - Editable title (saves on blur — allows renaming at any time)
  - Workout description (zone instructions)
  - Structured interval visualisation with colour-coded zone pills
  - Coach notes
  - Editable notes field
  - "Remove workout" button
- **Drag and drop** (long-press 300ms on mobile) to reorder within a day or move between days

### 3. Add Workout (Bottom Sheet)

Triggered by the "+" button on any day. Contains:

**Custom activity buttons** (2-column grid):
- Strength (barbell icon)
- Yoga (lotus pose icon)
- Cycling (bike icon)
- Hiking (mountain icon)
- Canicross (dog icon)

Tapping a custom activity opens a detail view with:
- Editable title (pre-filled with default, e.g. "Yoga")
- Notes field for details
- "Add to day" / "Close" buttons

**Reference plan workouts** (listed below custom activities):
- Shows all coded workouts from the mapped reference plan week
- Tapping one opens a **preview** showing:
  - Editable title (pre-filled, e.g. "RFR16 (Fartlek Run)" — can rename before adding)
  - Full workout description with zones
  - Structured interval visualisation
  - Coach notes
  - "Add to day" / "Close" buttons
- Added workouts are greyed out in the list; sheet stays open for adding multiple
- "Close" returns to the add-workout sheet

### 4. Race Countdown

- **Header badge** always visible: "[Race name] in Xw Yd (Type, Distance)"
- Shows the nearest upcoming race
- Countdown is precise: days when < 1 week, weeks + days otherwise

### 5. Races Tab

- List of all races ordered by date
- Each shows: name, date, type, distance, countdown
- Tap a race → edit form (name, date, type, distance_km, notes)
- "Add Race" button at bottom
- Delete option on existing races
- Race types: 5K, 10K, Half Marathon, Marathon, Ultra

### 6. Auto-Seeding from Reference Plan

- When navigating to a week with no existing data, workouts are auto-created from the 80/20 reference plan
- **Configurable week offset:** user sets "I'm on week X" in settings; auto-advances from that anchor
- Seeded workouts have `source: "reference"` and can be freely edited (they're copies)
- Rest Days and Walking entries from the reference plan are not seeded

### 7. Settings

- **Current reference plan week** (1–23): sets which plan week maps to this week
- **Plan end date** shown dynamically as the week number changes
- **Sign out** button

### 8. Dark Mode

- Toggle via moon icon in header
- Persisted to localStorage
- Full CSS variable system for all colours

### 9. PWA / Home Screen

- Standalone display mode
- Apple touch icons (152px, 180px)
- Manifest with 192px and 512px icons
- Favicon in browser tab

---

## Tech Stack

| Component | Choice |
|-----------|--------|
| Frontend | Vanilla HTML/CSS/JS, no build step |
| Hosting | GitHub Pages |
| Database | Firestore (project: `crawfordcommon-20462`) |
| Auth | Firebase Google Sign-In |
| Drag & drop | SortableJS (300ms touch delay) |
| PWA | manifest.json + apple-touch-icon |
| Architecture | IIFE module pattern, CSS variables, mobile-first |

---

## Data Model (Firestore Collections)

### /tp_races
| Field | Type | Description |
|-------|------|-------------|
| name | string | Race name |
| date | timestamp | Race date |
| race_type | string | "5k" / "10k" / "half_marathon" / "marathon" / "ultra" |
| distance_km | number | Distance in km |
| notes | string? | Optional notes |
| created_at | timestamp | Auto-set |

### /tp_weeks
| Field | Type | Description |
|-------|------|-------------|
| week_start | string | Monday date (YYYY-MM-DD) |
| reference_week | number? | Which 80/20 week it was seeded from |
| status | string | "planned" / "active" / "completed" |
| created_at | timestamp | Auto-set |

Document ID format: `2026-W18` (ISO year-week)

### /tp_workouts
| Field | Type | Description |
|-------|------|-------------|
| week_id | string | FK to tp_weeks |
| day_index | number | 0=Mon, 6=Sun |
| date | string | YYYY-MM-DD |
| order_index | number | Sort order within day |
| type | string | "run" / "strength" / "yoga" / "cycling" / "hiking" / "canicross" |
| title | string | Display title (editable) |
| source | string | "reference" / "custom" |
| reference_code | string? | e.g. "RFF48" |
| description | string? | Zone instructions text |
| coach_comments | string? | Coach guidance |
| planned_duration_hours | number? | Planned duration |
| planned_tss | number? | Training Stress Score |
| structure | string? | JSON-stringified interval structure |
| notes | string? | User notes |
| completed | boolean | Done status |
| completed_at | timestamp? | When marked done |
| created_at | timestamp | Auto-set |

### /tp_config/app
| Field | Type | Description |
|-------|------|-------------|
| current_reference_week | number | Which plan week is "now" |
| reference_week_anchor | string | Date when the above was set |

---

## Reference Plan Data

- Source: TrainingPeaks "80/20 Running: 2026 Edition Ultra 100 Mile Level 1 (HR-based)"
- 22 weeks, 198 workouts
- Stored as static JS module (`reference-data.js`, ~740KB)
- Includes: workout codes, descriptions, coach comments, HR zone structures, TSS, duration
- Workout types: Foundation Run, Endurance Run, Fartlek Run, Hill Repetitions, Fast Finish Run, Tempo Run, Progression Run, Critical Velocity Run, Steady State Run, Over/Under Intervals, and more

---

## File Structure

```
/awesome-runner
├── index.html              Single-page app shell
├── manifest.json           PWA manifest
├── firebase.json           Firebase config
├── firestore.indexes.json  Composite index for tp_workouts
├── .firebaserc             Firebase project ID
├── icon.png                Source icon (742x742)
├── /js
│   ├── firebase-config.js  Firebase SDK init
│   ├── store.js            Firestore CRUD layer
│   ├── reference-data.js   Static 80/20 plan data
│   ├── app.js              Main app (auth, week view, modals, drag-and-drop)
│   └── races.js            Races tab module
├── /css
│   └── styles.css          All styling (CSS variables, dark mode, mobile-first)
└── /img
    ├── icon-152.png        Apple touch icon
    ├── icon-180.png        Apple touch icon
    ├── icon-192.png        PWA icon / favicon
    └── icon-512.png        PWA icon
```

---

## Activity Type Icons

| Type | Icon Style |
|------|-----------|
| Run | Stick figure running (SVG line art) |
| Strength | Barbell (SVG line art) |
| Yoga | Lotus pose figure (SVG line art) |
| Cycling | Bicycle (SVG line art) |
| Hiking | Mountain peaks (SVG line art) |
| Canicross | Dog head side profile (SVG line art) |
