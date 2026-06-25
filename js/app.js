const App = (() => {
  let appStarted = false;
  let currentWeekOffset = 0;
  let workouts = [];
  let races = [];
  let config = {};
  let unsubscribers = [];
  let activeDay = null;

  const WORKOUT_ICONS = {
    run: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(24,0) scale(-1,1)"><path d="m15 10.42 4.8-5.07"/><path d="M19 18h3"/><path d="M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14"/></g></svg>',
    walk: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="1"/><path d="m9 20 1-7 3 2v5"/><path d="m10 13-1.5-4L6 11"/><path d="M13 9.5 16 11"/><path d="M8.5 9 10 7"/></svg>',
    strength: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"/><path d="M15 14a5 5 0 0 0-7.584 2"/><path d="M9.964 6.825C8.019 7.977 9.5 13 8 15"/></svg>',
    yoga: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.063,8.226a7.976,7.976,0,0,0-5.521.63,10.063,10.063,0,0,0-3.986-5.687,1,1,0,0,0-1.112,0A10.072,10.072,0,0,0,7.457,8.858a7.964,7.964,0,0,0-5.521-.632,1,1,0,0,0-.732.769,10.771,10.771,0,0,0,2.481,9.149C6.036,20.781,8.873,21,11.816,21h.356c2.947,0,5.786-.219,8.14-2.855A10.764,10.764,0,0,0,22.8,8.994,1,1,0,0,0,22.063,8.226ZM12,5.245a8.36,8.36,0,0,1,2.772,4.73,9.256,9.256,0,0,0-1.089,1.017A10.3,10.3,0,0,0,12,13.515a10.345,10.345,0,0,0-1.687-2.523A9.314,9.314,0,0,0,9.227,9.98,8.362,8.362,0,0,1,12,5.245ZM10.958,18.992c-2.272-.05-4.173-.376-5.78-2.179A8.762,8.762,0,0,1,3.06,10.04a6.63,6.63,0,0,1,5.762,2.341A8.768,8.768,0,0,1,10.958,18.992Zm7.861-2.179c-1.61,1.8-3.513,2.129-5.789,2.179a8.759,8.759,0,0,1,2.138-6.61,6.808,6.808,0,0,1,5.011-2.393,5.528,5.528,0,0,1,.761.052A8.755,8.755,0,0,1,18.819,16.813Z"/></svg>',
    cycling: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>',
    hiking: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/></svg>',
    canicross: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>',
    note: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
  };

  const TYPE_LABELS = {
    run: 'Run', walk: 'Walk', strength: 'Strength', yoga: 'Yoga',
    cycling: 'Cycling', hiking: 'Hiking', canicross: 'Canicross', note: 'Note'
  };

  const RACE_TYPES = {
    '5k': '5K',
    '10k': '10K',
    'half_marathon': 'Half Marathon',
    'marathon': 'Marathon',
    'ultra': 'Ultra'
  };

  const DAY_COLOUR_PALETTE = [
    { name: 'Rose',     header: '#E8A0A0', tint: '#FDF0F0' },
    { name: 'Peach',    header: '#E8C4A0', tint: '#FDF5F0' },
    { name: 'Sand',     header: '#E8D8A0', tint: '#FDFAF0' },
    { name: 'Sage',     header: '#A0D8A0', tint: '#F0FDF0' },
    { name: 'Sky',      header: '#A0C4E8', tint: '#F0F5FD' },
    { name: 'Lavender', header: '#C4A0E8', tint: '#F5F0FD' },
    { name: 'Slate',    header: '#A0B8C8', tint: '#F0F4F8' },
    { name: 'Blush',    header: '#E8A0C4', tint: '#FDF0F5' },
  ];

  const DAY_COLOUR_PALETTE_DARK = [
    { name: 'Rose',     header: '#8B5E5E', tint: '#3A2A2A' },
    { name: 'Peach',    header: '#8B7A5E', tint: '#3A3228' },
    { name: 'Sand',     header: '#8B845E', tint: '#3A3828' },
    { name: 'Sage',     header: '#5E8B5E', tint: '#283A28' },
    { name: 'Sky',      header: '#5E7A8B', tint: '#28323A' },
    { name: 'Lavender', header: '#7A5E8B', tint: '#32283A' },
    { name: 'Slate',    header: '#5E7080', tint: '#282E34' },
    { name: 'Blush',    header: '#8B5E7A', tint: '#3A2832' },
  ];

  const DEFAULT_DAY_COLOURS = {
    "0": "#A0C4E8",
    "1": "#A0D8A0",
    "2": "#E8D8A0",
    "3": "#E8C4A0",
    "4": "#C4A0E8",
    "5": "#E8A0C4",
    "6": "#E8A0A0",
  };

  function getDayColour(dayIndex) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const activePalette = isDark ? DAY_COLOUR_PALETTE_DARK : DAY_COLOUR_PALETTE;
    const dayColours = config.day_colors || DEFAULT_DAY_COLOURS;
    const storedHex = dayColours[String(dayIndex)];
    let idx = DAY_COLOUR_PALETTE.findIndex(p => p.header === storedHex);
    if (idx === -1) idx = DAY_COLOUR_PALETTE_DARK.findIndex(p => p.header === storedHex);
    if (idx === -1) return { header: storedHex, tint: storedHex + '20' };
    return activePalette[idx];
  }

  // --- Date Utilities ---
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekId(mondayDate) {
    const d = new Date(mondayDate);
    const year = d.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const days = Math.floor((d - jan1) / 86400000);
    const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }

  function formatDate(date) {
    // Local YYYY-MM-DD (avoid toISOString UTC shift, which moves a day in BST)
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDateShort(date) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function getCurrentMonday() {
    const today = new Date();
    const monday = getMonday(today);
    monday.setDate(monday.getDate() + (currentWeekOffset * 7));
    return monday;
  }

  // Find the plan week whose date span contains any day of the viewed week.
  // The plan is calendar-stamped, so we match by real date rather than an offset.
  function getPlanWeekForMonday(monday) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mondayStr = formatDate(monday);
    const sundayStr = formatDate(sunday);
    return PlanData.weeks.find(w =>
      // overlap test: plan week starts on/before viewed Sun AND ends on/after viewed Mon
      w.start_date <= sundayStr && w.end_date >= mondayStr
    ) || null;
  }

  function formatCountdown(raceDate) {
    const now = new Date();
    const diffMs = raceDate - now;
    const totalDays = Math.floor(diffMs / 86400000);
    if (totalDays < 0) return 'Done';
    if (totalDays === 0) return 'Today';
    if (totalDays === 1) return 'Tomorrow';
    if (totalDays < 7) return `${totalDays} days`;
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    if (remainingDays === 0) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    return `${weeks}w ${remainingDays}d`;
  }

  // --- Plan type mapping ---
  // The Glenmore plan uses more granular types than the app renders. Map each
  // to an app category (icon/colour), and classify markers vs real workouts.
  const PLAN_TYPE_MAP = {
    run: 'run', long_run: 'run', hill_run: 'run', interval_run: 'run', recovery_run: 'run',
    walk: 'walk',
    bike: 'cycling',
    hike: 'hiking',
    strength: 'strength',
    yoga: 'yoga',
    // either-or: first-named type wins; both stay in the title
    bike_or_hike: 'cycling', run_or_bike: 'run', hike_walk: 'hiking', hike_run: 'hiking',
  };
  // Non-workout markers shown as small info cards on the day.
  const PLAN_MARKER_TYPES = new Set(['note', 'logistics', 'no_strength']);
  // Skipped entirely (Glenmore 24 lives in the Races tab).
  const PLAN_SKIP_TYPES = new Set(['race']);

  function mapPlanType(planType) {
    return PLAN_TYPE_MAP[planType] || 'run';
  }

  // Build a display description for a plan activity, folding in strength
  // exercise lists and any intensity/measurement detail.
  function buildPlanDescription(act) {
    const parts = [];
    if (act.description) parts.push(act.description);

    (act.strength_workout_refs || []).forEach(ref => {
      const sw = PlanData.strength_workouts[ref];
      if (!sw) return;
      let block = sw.title;
      if (sw.notes && sw.notes.length) block += ` (${sw.notes.join('; ')})`;
      if (sw.exercises_text) block += `\n${sw.exercises_text}`;
      parts.push(block);
    });

    return parts.join('\n\n') || null;
  }

  function getPlanEndDate() {
    return new Date(PlanData.end_date + 'T00:00:00');
  }

  // --- Auth ---
  function initAuth() {
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    document.getElementById('google-signin-btn').addEventListener('click', async () => {
      try {
        await firebase.auth().signInWithPopup(googleProvider);
      } catch (err) {
        if (err.code === 'auth/popup-blocked') {
          firebase.auth().signInWithRedirect(googleProvider);
        }
      }
    });

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        showApp();
      } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.querySelector('.app').classList.remove('active');
      }
    });
  }

  async function showApp() {
    if (appStarted) return;
    appStarted = true;

    document.getElementById('auth-screen').classList.add('hidden');
    document.querySelector('.app').classList.add('active');

    config = await Store.getConfig();

    initRealtime();
    initEventListeners();
    loadWeek();
  }

  // --- Realtime ---
  function initRealtime() {
    unsubscribers.push(
      Store.onRacesChanged(newRaces => {
        races = newRaces;
        renderRaceCountdown();
        Races.render(races);
      })
    );
  }

  function subscribeToWeek(weekId) {
    if (unsubscribers.length > 1) {
      unsubscribers[1]();
      unsubscribers.splice(1, 1);
    }
    unsubscribers.push(
      Store.onWorkoutsForWeek(weekId, newWorkouts => {
        workouts = newWorkouts;
        renderWeek();
      })
    );
  }

  // --- Week Loading & Seeding ---
  async function loadWeek() {
    const monday = getCurrentMonday();
    const weekId = getWeekId(monday);
    const existing = await Store.getWeek(weekId);

    if (!existing) {
      await seedWeek(monday, weekId);
    }

    subscribeToWeek(weekId);
    renderWeekNav();
  }

  async function seedWeek(monday, weekId) {
    const planWeek = getPlanWeekForMonday(monday);

    await Store.createWeek(weekId, {
      week_start: formatDate(monday),
      plan_week: planWeek ? planWeek.week : null,
      status: 'planned'
    });

    if (!planWeek) return;

    const batch = [];
    planWeek.days.forEach(day => {
      // Place each plan day at its real calendar day_index (0=Mon..6=Sun).
      // Some plan days have no single date (e.g. the Sat/Sun race) — skip them;
      // the race itself lives in the Races tab.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date || '')) return;
      const dayDate = new Date(day.date + 'T00:00:00');
      const dayIndex = (dayDate.getDay() + 6) % 7;

      day.activities.forEach((act, seq) => {
        if (PLAN_SKIP_TYPES.has(act.type)) return;
        const isMarker = PLAN_MARKER_TYPES.has(act.type);

        batch.push(Store.createWorkout({
          week_id: weekId,
          day_index: dayIndex,
          date: day.date,
          order_index: seq,
          type: isMarker ? 'note' : mapPlanType(act.type),
          title: act.title,
          source: 'plan',
          is_marker: isMarker,
          reference_code: null,
          description: isMarker ? (act.description || null) : buildPlanDescription(act),
          coach_comments: null,
          intensity: (act.intensity && act.intensity.length) ? act.intensity.join(', ') : null,
          measurements: (act.measurements && act.measurements.length) ? act.measurements.join(', ') : null,
          planned_duration_hours: null,
          planned_tss: null,
          structure: null,
          notes: null
        }));
      });
    });
    await Promise.all(batch);
  }

  // --- Rendering ---
  function renderWeekNav() {
    const monday = getCurrentMonday();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const planWeek = getPlanWeekForMonday(monday);
    const label = document.getElementById('week-nav-label');
    const isThisWeek = currentWeekOffset === 0;

    let weekLabel = isThisWeek ? 'This Week' : (currentWeekOffset > 0 ? `+${currentWeekOffset} week${currentWeekOffset > 1 ? 's' : ''}` : `${currentWeekOffset} week${currentWeekOffset < -1 ? 's' : ''}`);
    let refLabel = planWeek ? ` (Plan Wk ${planWeek.week})` : '';

    label.innerHTML = `${weekLabel}${refLabel}<span class="week-dates">${formatDateShort(monday)} – ${formatDateShort(sunday)} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;opacity:0.5;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span><input type="date" id="week-date-picker" value="${formatDate(monday)}" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;z-index:10;-webkit-appearance:none;">`;

    document.getElementById('week-date-picker').addEventListener('change', (e) => {
      const picked = e.target.value;
      if (!picked) return;
      const pickedDate = new Date(picked + 'T00:00:00');
      const thisMonday = getMonday(new Date());
      const pickedMonday = getMonday(pickedDate);
      currentWeekOffset = Math.round((pickedMonday - thisMonday) / (7 * 86400000));
      loadWeek();
    });
  }

  function renderWeek() {
    const monday = getCurrentMonday();
    const today = formatDate(new Date());
    const container = document.getElementById('week-days');
    container.innerHTML = '';

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = formatDate(dayDate);
      const isToday = dateStr === today;

      const dayWorkouts = workouts.filter(w => w.day_index === i).sort((a, b) => a.order_index - b.order_index);
      const colours = getDayColour(i);

      const card = document.createElement('div');
      card.className = `day-card${isToday ? ' today' : ''}`;
      card.dataset.dayIndex = i;

      card.innerHTML = `
        <div class="day-card-header" style="background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.25) 100%), ${colours.header}; border-bottom-color: transparent;">
          <span class="day-name">${days[i]}</span>
          <span style="display:flex;align-items:center;gap:8px;">
            <span class="day-date">${formatDateShort(dayDate)}</span>
            <button class="btn-colour-day" data-day="${i}" title="Change colour"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/></svg></button>
            ${dayWorkouts.length > 0 ? `<button class="btn-clear-day" data-day="${i}" title="Clear day"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg></button>` : ''}
          </span>
        </div>
        <div class="day-card-body${dayWorkouts.length === 0 ? ' empty' : ''}" data-day="${i}" style="background: ${colours.tint};">
          ${dayWorkouts.map(w => renderWorkoutCard(w)).join('')}
          <button class="btn-add-workout" data-day="${i}">+ Add</button>
        </div>
      `;

      container.appendChild(card);
    }

    initDragAndDrop();
  }

  function renderWorkoutCard(w) {
    const icon = WORKOUT_ICONS[w.type] || WORKOUT_ICONS.run;

    // Info-card markers (note/logistics/no_strength): no checkbox, show the note text.
    if (w.is_marker) {
      return `
        <div class="workout-card marker" data-id="${w.id}">
          <div class="workout-type-icon note">${WORKOUT_ICONS.note}</div>
          <div class="workout-info" data-id="${w.id}">
            <div class="workout-title">${escapeHtml(w.description || w.title)}</div>
          </div>
        </div>
      `;
    }

    // Meta line: prefer plan intensity/measurements; fall back to legacy duration/code.
    let meta = [w.intensity, w.measurements].filter(Boolean).join(' · ');
    if (!meta) {
      const dur = w.planned_duration_hours;
      let durStr = '';
      if (dur) {
        const h = Math.floor(dur);
        const m = Math.round((dur - h) * 60);
        durStr = h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
      }
      meta = [durStr, w.reference_code].filter(Boolean).join(' · ');
    }

    return `
      <div class="workout-card${w.completed ? ' completed' : ''}" data-id="${w.id}">
        <div class="workout-type-icon ${w.type}">${icon}</div>
        <div class="workout-info" data-id="${w.id}">
          <div class="workout-title">${escapeHtml(w.title)}</div>
          ${meta ? `<div class="workout-meta">${escapeHtml(meta)}</div>` : ''}
        </div>
        <div class="workout-check${w.completed ? ' done' : ''}" data-id="${w.id}">${w.completed ? '✓' : ''}</div>
      </div>
    `;
  }

  function renderRaceCountdown() {
    const el = document.getElementById('race-countdown');
    const now = new Date();
    const upcoming = races.filter(r => r.date && r.date.toDate() > now);

    if (upcoming.length === 0) {
      el.classList.add('hidden');
      return;
    }

    const next = upcoming[0];
    const raceDate = next.date.toDate();
    const countdown = formatCountdown(raceDate);
    const typeLabel = RACE_TYPES[next.race_type] || next.race_type;
    const distLabel = next.distance_km ? `${next.distance_km}km` : '';
    const detail = [typeLabel, distLabel].filter(Boolean).join(', ');

    el.classList.remove('hidden');
    el.innerHTML = `<strong>${escapeHtml(next.name)}</strong> in ${countdown} <span class="race-detail">(${detail})</span>`;
  }

  // --- Event Listeners ---
  function initEventListeners() {
    document.getElementById('week-prev').addEventListener('click', () => { currentWeekOffset--; loadWeek(); });
    document.getElementById('week-next').addEventListener('click', () => { currentWeekOffset++; loadWeek(); });
    document.getElementById('week-today').addEventListener('click', () => { currentWeekOffset = 0; loadWeek(); });

    document.getElementById('tab-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      switchPage(btn.dataset.page);
    });

    document.getElementById('week-days').addEventListener('click', (e) => {
      const checkEl = e.target.closest('.workout-check');
      if (checkEl) {
        e.stopPropagation();
        toggleComplete(checkEl.dataset.id);
        return;
      }

      const infoEl = e.target.closest('.workout-info');
      if (infoEl) {
        openWorkoutDetail(infoEl.dataset.id);
        return;
      }

      const colourBtn = e.target.closest('.btn-colour-day');
      if (colourBtn) {
        e.stopPropagation();
        openDayColourPicker(parseInt(colourBtn.dataset.day));
        return;
      }

      const clearBtn = e.target.closest('.btn-clear-day');
      if (clearBtn) {
        e.stopPropagation();
        clearDay(parseInt(clearBtn.dataset.day));
        return;
      }

      const addBtn = e.target.closest('.btn-add-workout');
      if (addBtn) {
        activeDay = parseInt(addBtn.dataset.day);
        openAddWorkoutSheet();
        return;
      }
    });

    document.getElementById('btn-settings').addEventListener('click', openSettings);
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-overlay').classList.add('hidden');
      });
    });
  }

  // --- Actions ---
  function toggleComplete(workoutId) {
    const w = workouts.find(x => x.id === workoutId);
    if (!w) return;
    Store.updateWorkout(workoutId, {
      completed: !w.completed,
      completed_at: !w.completed ? firebase.firestore.FieldValue.serverTimestamp() : null
    });
  }

  function clearDay(dayIndex) {
    const dayWorkouts = workouts.filter(w => w.day_index === dayIndex);
    if (dayWorkouts.length === 0) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!confirm(`Clear all ${dayWorkouts.length} workout${dayWorkouts.length > 1 ? 's' : ''} from ${days[dayIndex]}?`)) return;
    Promise.all(dayWorkouts.map(w => Store.deleteWorkout(w.id)));
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ar_theme', next);
    renderWeek();
  }

  function openDayColourPicker(dayIndex) {
    const overlay = document.getElementById('colour-modal-overlay');
    const grid = document.getElementById('colour-grid');
    const dayColours = config.day_colors || DEFAULT_DAY_COLOURS;
    const currentHex = dayColours[String(dayIndex)];

    grid.innerHTML = '';
    DAY_COLOUR_PALETTE.forEach(colour => {
      const swatch = document.createElement('button');
      swatch.className = 'colour-swatch' + (currentHex === colour.header ? ' selected' : '');
      swatch.style.background = colour.header;
      swatch.title = colour.name;
      swatch.addEventListener('click', async () => {
        const dayColors = config.day_colors ? { ...config.day_colors } : { ...DEFAULT_DAY_COLOURS };
        dayColors[String(dayIndex)] = colour.header;
        config.day_colors = dayColors;
        await Store.saveConfig({ day_colors: dayColors });
        overlay.classList.add('hidden');
        renderWeek();
      });
      grid.appendChild(swatch);
    });

    overlay.classList.remove('hidden');
  }

  function openWorkoutDetail(workoutId) {
    const w = workouts.find(x => x.id === workoutId);
    if (!w) return;
    showWorkoutDetailModal(w);
  }

  function showWorkoutDetailModal(w) {
    const overlay = document.getElementById('workout-detail-overlay');
    const body = document.getElementById('workout-detail-body');
    const dayColour = getDayColour(w.day_index);
    body.style.background = dayColour.tint;
    applyDayGradientToHeader(overlay, w.day_index);
    const typeLabel = TYPE_LABELS[w.type] || (w.type.charAt(0).toUpperCase() + w.type.slice(1));
    document.getElementById('workout-detail-title').textContent = typeLabel;

    let html = `<div class="workout-detail-section" style="margin-bottom:12px;"><h4>Title</h4>`;
    html += `<input type="text" class="notes-field" id="detail-title" value="${escapeHtml(w.title)}" style="min-height:auto;padding:8px 12px;font-weight:600;font-size:15px;"></div>`;

    if (w.description) {
      html += `<div class="workout-detail-section"><h4>Workout</h4><p style="white-space:pre-wrap;">${escapeHtml(w.description)}</p></div>`;
    }

    if (w.intensity || w.measurements) {
      html += `<div class="workout-detail-section"><h4>Details</h4><div class="zone-pills">`;
      if (w.intensity) html += `<span class="zone-pill" style="background:var(--zone2-bg);color:var(--zone2)">${escapeHtml(w.intensity)}</span>`;
      if (w.measurements) {
        w.measurements.split(',').map(s => s.trim()).filter(Boolean).forEach(m => {
          html += `<span class="zone-pill">${escapeHtml(m)}</span>`;
        });
      }
      html += `</div></div>`;
    }

    // Legacy HR-zone structure (kept for any pre-existing 80/20 workouts)
    let parsedStructure = null;
    if (w.structure) {
      if (typeof w.structure === 'string') { try { parsedStructure = JSON.parse(w.structure); } catch(e) {} }
      else { parsedStructure = w.structure; }
    }

    if (parsedStructure && parsedStructure.structure) {
      html += `<div class="workout-detail-section"><h4>Structure</h4><div class="zone-pills">`;
      parsedStructure.structure.forEach(block => {
        if (block.steps) {
          block.steps.forEach(step => {
            const dur = step.length ? formatSeconds(step.length.value) : '';
            const targets = step.targets && step.targets[0];
            let zoneCss = '';
            if (targets) {
              const lo = targets.minValue;
              if (lo <= 76) zoneCss = 'background:var(--zone1-bg);color:var(--zone1)';
              else if (lo <= 87) zoneCss = 'background:var(--zone2-bg);color:var(--zone2)';
              else if (lo <= 100) zoneCss = 'background:var(--zone3-bg);color:var(--zone3)';
              else if (lo <= 115) zoneCss = 'background:var(--zone4-bg);color:var(--zone4)';
              else zoneCss = 'background:var(--zone5-bg);color:var(--zone5)';
            }
            html += `<span class="zone-pill" style="${zoneCss}">${step.name} ${dur}</span>`;
          });
        }
      });
      html += `</div></div>`;
    }

    if (w.coach_comments) {
      html += `<div class="workout-detail-section"><h4>Coach Notes</h4><p>${escapeHtml(w.coach_comments)}</p></div>`;
    }

    html += `<div class="workout-detail-section"><h4>Notes</h4>`;
    html += `<textarea class="notes-field" id="detail-notes" placeholder="Add notes...">${escapeHtml(w.notes || '')}</textarea></div>`;

    html += `<button class="btn-danger" id="detail-delete">Remove workout</button>`;

    body.innerHTML = html;
    overlay.classList.remove('hidden');

    document.getElementById('detail-title').addEventListener('blur', () => {
      const val = document.getElementById('detail-title').value.trim();
      if (val && val !== w.title) {
        Store.updateWorkout(w.id, { title: val });
      }
    });

    document.getElementById('detail-notes').addEventListener('blur', () => {
      const val = document.getElementById('detail-notes').value;
      if (val !== (w.notes || '')) {
        Store.updateWorkout(w.id, { notes: val });
      }
    });

    document.getElementById('detail-delete').addEventListener('click', () => {
      Store.deleteWorkout(w.id);
      overlay.classList.add('hidden');
    });
  }

  function applyDayGradientToHeader(overlay, dayIndex) {
    const colours = getDayColour(dayIndex);
    const header = overlay.querySelector('.modal-header');
    if (header) {
      header.style.background = `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.25) 100%), ${colours.header}`;
      header.style.borderBottom = 'none';
      header.querySelector('h3').style.color = '#2C2C2E';
    }
  }

  function openAddWorkoutSheet() {
    const overlay = document.getElementById('add-workout-overlay');
    const modalBody = overlay.querySelector('.modal-body');
    const colours = getDayColour(activeDay);
    modalBody.style.background = colours.tint;
    applyDayGradientToHeader(overlay, activeDay);
    overlay.classList.remove('hidden');
  }

  const TYPE_TINTS = {
    run: { light: '#e3f2fd', dark: '#1a2a3a' },
    walk: { light: '#e0f2f4', dark: '#16323a' },
    strength: { light: '#fff3e0', dark: '#3a2a1a' },
    yoga: { light: '#f3e5f5', dark: '#2a1a3a' },
    cycling: { light: '#e8f5e9', dark: '#1a2a1a' },
    hiking: { light: '#efebe9', dark: '#2a2420' },
    canicross: { light: '#fbe9e7', dark: '#3a2020' },
  };

  function addCustomWorkout(type) {
    const titles = { run: 'Run', walk: 'Walk', strength: 'Strength Training', yoga: 'Yoga', cycling: 'Cycling', hiking: 'Hiking', canicross: 'Canicross' };
    const defaultTitle = titles[type] || type;

    document.getElementById('add-workout-overlay').classList.add('hidden');

    const overlay = document.getElementById('workout-detail-overlay');
    const body = document.getElementById('workout-detail-body');
    const dayColour = getDayColour(activeDay);
    body.style.background = dayColour.tint;
    applyDayGradientToHeader(overlay, activeDay);
    document.getElementById('workout-detail-title').textContent = defaultTitle;

    let html = `<div class="workout-detail-section"><h4>Title</h4>`;
    html += `<input type="text" class="notes-field" id="custom-workout-title" value="${escapeHtml(defaultTitle)}" style="min-height:auto;padding:8px 12px;"></div>`;
    html += `<div class="workout-detail-section"><h4>Notes</h4>`;
    html += `<textarea class="notes-field" id="custom-workout-notes" placeholder="Add details..."></textarea></div>`;
    html += `<div style="display:flex;gap:8px;margin-top:16px;">`;
    html += `<button class="btn-primary" id="custom-preview-add" style="flex:1;">Add to day</button>`;
    html += `<button class="btn-danger" id="custom-preview-close" style="flex:1;margin-top:0;border-color:var(--border);color:var(--text-secondary);">Close</button>`;
    html += `</div>`;

    body.innerHTML = html;
    overlay.classList.remove('hidden');

    document.getElementById('custom-preview-add').addEventListener('click', async () => {
      const monday = getCurrentMonday();
      const weekId = getWeekId(monday);
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + activeDay);
      const existing = workouts.filter(w => w.day_index === activeDay);
      const title = document.getElementById('custom-workout-title').value.trim() || defaultTitle;
      const notes = document.getElementById('custom-workout-notes').value.trim() || null;

      await Store.createWorkout({
        week_id: weekId,
        day_index: activeDay,
        date: formatDate(dayDate),
        order_index: existing.length,
        type: type,
        title: title,
        source: 'custom',
        reference_code: null,
        description: null,
        coach_comments: null,
        planned_duration_hours: null,
        planned_tss: null,
        structure: null,
        notes: notes
      });

      overlay.classList.add('hidden');
    });

    document.getElementById('custom-preview-close').addEventListener('click', () => {
      overlay.classList.add('hidden');
      openAddWorkoutSheet();
    });
  }

  // --- Settings ---
  function openSettings() {
    const overlay = document.getElementById('settings-overlay');
    const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('settings-plan-name').textContent = PlanData.plan_name;
    document.getElementById('settings-plan-range').textContent =
      `${fmt(PlanData.start_date)} – ${fmt(PlanData.end_date)} (${PlanData.total_weeks} weeks)`;
    overlay.classList.remove('hidden');
  }

  // --- Drag & Drop ---
  function initDragAndDrop() {
    document.querySelectorAll('.day-card-body').forEach(el => {
      if (el._sortable) el._sortable.destroy();
      el._sortable = new Sortable(el, {
        group: 'workouts',
        animation: 150,
        handle: '.workout-card',
        draggable: '.workout-card',
        delay: 300,
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: (evt) => {
          const workoutId = evt.item.dataset.id;
          const newDayIndex = parseInt(evt.to.dataset.day);
          const newOrderIndex = evt.newIndex;

          const updates = [{ id: workoutId, data: { day_index: newDayIndex, order_index: newOrderIndex } }];

          const items = evt.to.querySelectorAll('.workout-card');
          items.forEach((item, idx) => {
            if (item.dataset.id !== workoutId) {
              updates.push({ id: item.dataset.id, data: { order_index: idx } });
            }
          });

          Store.batchUpdateWorkouts(updates);
        }
      });
    });
  }

  // --- Navigation ---
  function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    const tab = document.querySelector(`.tab-btn[data-page="${pageId}"]`);
    if (page) page.classList.add('active');
    if (tab) tab.classList.add('active');
  }

  // --- Helpers ---
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatSeconds(s) {
    if (s >= 3600) {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return m ? `${h}h${m}m` : `${h}h`;
    }
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec ? `${m}:${String(sec).padStart(2, '0')}` : `${m}:00`;
  }

  // --- Init ---
  function init() {
    const theme = localStorage.getItem('ar_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    initAuth();
  }

  return { init, addCustomWorkout, switchPage };
})();

document.addEventListener('DOMContentLoaded', App.init);
