# Awesome Runner — Product Specification

## Overview

A mobile-first PWA training planner for ultramarathon preparation. Provides a weekly planning workspace where Ly can view, adapt, and track workouts seeded from the Glenmore 24 training plan (date-stamped per week), supplemented with custom activities.

**Users:** Ly (primary), Ryan (secondary)
**Live URL:** https://edinburghryan.github.io/awesome-runner/
**Repo:** github.com/edinburghryan/awesome-runner

---

## Core Workflow

1. Open app → see today's workout(s) highlighted + race countdown in header
2. End of week → navigate to next week (auto-seeded from the training plan by date)
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
- **Plan week indicator** — shows which training plan week maps to the viewed week (e.g. "Plan Wk 5")

### 2. Workout Cards

- Tap the **checkbox** → toggles done/not-done
- Tap the **workout info** → opens detail modal with:
  - Editable title (saves on blur — allows renaming at any time)
  - Workout description (zone instructions)
  - Intensity / measurement detail pills (plan workouts); colour-coded HR zone pills for any legacy 80/20 workouts
  - Coach notes
  - Editable notes field
  - "Remove workout" button
- **Drag and drop** (long-press 300ms on mobile) to reorder within a day or move between days

### 3. Add Workout (Bottom Sheet)

Triggered by the "+" button on any day. Contains:

**Custom activity buttons** (2-column grid):
- Run (running figure icon)
- Walk (walking figure icon)
- Strength (barbell icon)
- Yoga (lotus pose icon)
- Cycling (bike icon)
- Hiking (mountain icon)
- Canicross (dog icon)

Tapping a custom activity opens a detail view with:
- Editable title (pre-filled with default, e.g. "Yoga")
- Notes field for details
- "Add to day" / "Close" buttons

**Training plan workouts** (listed below custom activities):
- Shows the activities from the plan week mapped to the viewed week (markers and the race are excluded), each with its mapped category icon
- Tapping one opens a **preview** showing:
  - Editable title (pre-filled — can rename before adding)
  - Full workout description (strength exercise lists folded in)
  - Intensity / measurement detail pills
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

### 6. Auto-Seeding from Training Plan

- When navigating to a week with no existing data, workouts are auto-created from the Glenmore 24 plan
- **Date-based:** the plan is calendar-stamped per week, so a viewed week seeds from the plan week whose date span overlaps it (no manual week offset)
- Seeded workouts have `source: "plan"` and can be freely edited (they're copies)
- Plan activity types are mapped to app categories (e.g. `bike`→cycling, `hike`→hiking, `long_run`/`hill_run`→run); either-or activities (`bike_or_hike`) use the first-named type with both kept in the title
- Non-workout markers (`note`, `logistics`, `no_strength`) seed as small info cards (`is_marker: true`, no checkbox); the `race` marker is skipped (Glenmore 24 lives in the Races tab)
- Strength days fold their referenced exercise list into the workout description

### 7. Settings

- **Training plan** name and date range (read-only) — the plan auto-seeds by date
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
| plan_week | number? | Which Glenmore plan week it was seeded from |
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
| type | string | "run" / "walk" / "strength" / "yoga" / "cycling" / "hiking" / "canicross" / "note" |
| title | string | Display title (editable) |
| source | string | "plan" / "custom" |
| is_marker | boolean? | True for info-card markers (note/logistics/no_strength) — rendered without a checkbox |
| reference_code | string? | Legacy 80/20 code (null for plan workouts) |
| description | string? | Workout instructions; strength exercise list folded in |
| coach_comments | string? | Coach guidance (legacy) |
| intensity | string? | Plan intensity, e.g. "Zone 2" |
| measurements | string? | Plan measurements, e.g. "30-45 min, 5 km" |
| planned_duration_hours | number? | Planned duration (legacy 80/20) |
| planned_tss | number? | Training Stress Score (legacy 80/20) |
| structure | string? | JSON-stringified interval structure (legacy 80/20) |
| notes | string? | User notes |
| completed | boolean | Done status |
| completed_at | timestamp? | When marked done |
| created_at | timestamp | Auto-set |

### /tp_config/app
| Field | Type | Description |
|-------|------|-------------|
| day_colors | map? | Per-day-of-week colour overrides |

---

## Training Plan Data

- Source: `Glenmore_24_Training_Plan_2026.json` (kept in repo as source of truth)
- 11 weeks, 2026-06-23 → 2026-09-06, 75 days, ~208 activities
- Compiled to static JS module (`plan-data.js`) via a one-off script from the JSON
- Each week carries `start_date`/`end_date`/`focus`; each day lists activities with type, title, description, intensity, parsed measurements, and strength-workout refs
- Strength workouts stored separately keyed by id (e.g. `home_strength_2`), with full exercise lists folded into descriptions at seed time

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
│   ├── plan-data.js        Static Glenmore 24 plan data (compiled from JSON)
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
| Run | Stick figure running (SVG line art), blue `#1565c0` |
| Walk | Walking figure (SVG line art), teal `#00838f` |
| Strength | Barbell (SVG line art) |
| Yoga | Lotus pose figure (SVG line art) |
| Cycling | Bicycle (SVG line art) |
| Hiking | Mountain peaks (SVG line art) |
| Canicross | Dog head side profile (SVG line art) |
