const App = (() => {
  let appStarted = false;
  let currentWeekOffset = 0;
  let workouts = [];
  let races = [];
  let config = {};
  let unsubscribers = [];
  let activeDay = null;

  const WORKOUT_ICONS = {
    run: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 4a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0"/><path d="M7 21l3-4 2.5 1 3.5-5-2-2-4 1-3 4"/><path d="M16 21l-2-5 3-3 2-4"/></svg>',
    strength: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><rect x="5" y="7" width="3" height="10" rx="1"/><rect x="16" y="7" width="3" height="10" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    yoga: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"/><path d="M12 8v5"/><path d="M8 18c0-3 2-5 4-5s4 2 4 5"/><path d="M6 18h12"/><path d="M9 11l-3-1M15 11l3-1"/></svg>',
    cycling: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h4l3 5M14 9l1-3"/></svg>',
    hiking: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l4-12 4 6 4-8 4 14"/></svg>',
    canicross: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 20c0-4 1-7 3-9 1.5-1.5 2-3 1.5-5C12 4 11 3 9.5 3 8 3 6.5 4.5 6 7c-.5 2.5-1 4-3 5"/><path d="M14.5 3c1.5 0 3 1 3.5 3 .3 1.5 0 3-1 4.5-1.5 2-2 5-2 7"/><path d="M9 8c1-1 2.5-1 3.5 0"/></svg>'
  };

  const RACE_TYPES = {
    '5k': '5K',
    '10k': '10K',
    'half_marathon': 'Half Marathon',
    'marathon': 'Marathon',
    'ultra': 'Ultra'
  };

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
    return date.toISOString().split('T')[0];
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

  function getReferenceWeekForDate(monday) {
    if (!config.current_reference_week || !config.reference_week_anchor) return null;
    // Parse anchor date as local (avoid timezone shift from ISO string)
    const parts = config.reference_week_anchor.split('-');
    const anchor = getMonday(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    const diffWeeks = Math.round((monday - anchor) / (7 * 86400000));
    const refWeek = config.current_reference_week + diffWeeks;
    if (refWeek < 1 || refWeek > ReferenceData.weeks.length) return null;
    return refWeek;
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

  function getPlanEndDate() {
    if (!config.current_reference_week || !config.reference_week_anchor) return null;
    const anchor = getMonday(new Date(config.reference_week_anchor));
    const weeksRemaining = ReferenceData.weeks.length - config.current_reference_week;
    const endMonday = new Date(anchor);
    endMonday.setDate(anchor.getDate() + (weeksRemaining * 7) + 6);
    return endMonday;
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

    if (!config.current_reference_week) {
      config.current_reference_week = 1;
      config.reference_week_anchor = formatDate(getMonday(new Date()));
      await Store.saveConfig(config);
    }

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
    const refWeekNum = getReferenceWeekForDate(monday);
    const refWeek = refWeekNum ? ReferenceData.weeks[refWeekNum - 1] : null;

    await Store.createWeek(weekId, {
      week_start: formatDate(monday),
      reference_week: refWeekNum,
      status: 'planned'
    });

    if (refWeek) {
      const batch = [];
      refWeek.workouts.forEach((w, idx) => {
        if (!w.code && w.workout_type === 'Rest Day') return;
        if (!w.code && w.workout_type === 'Walking') return;

        const originalDate = new Date(w.date);
        const dayOfWeek = originalDate.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const workoutDate = new Date(monday);
        workoutDate.setDate(monday.getDate() + dayIndex);

        let seedStructure = null;
        if (w.structure) { try { seedStructure = JSON.stringify(w.structure); } catch(e) {} }

        batch.push(Store.createWorkout({
          week_id: weekId,
          day_index: dayIndex,
          date: formatDate(workoutDate),
          order_index: idx,
          type: 'run',
          title: w.title || `${w.code} (${w.workout_type})`,
          source: 'reference',
          reference_code: w.code,
          description: w.description || null,
          coach_comments: w.coach_comments || null,
          planned_duration_hours: typeof w.planned_duration_hours === 'number' ? w.planned_duration_hours : null,
          planned_tss: typeof w.planned_tss === 'number' ? w.planned_tss : null,
          structure: seedStructure,
          notes: null
        }));
      });
      await Promise.all(batch);
    }
  }

  // --- Rendering ---
  function renderWeekNav() {
    const monday = getCurrentMonday();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const refWeek = getReferenceWeekForDate(monday);
    const label = document.getElementById('week-nav-label');
    const isThisWeek = currentWeekOffset === 0;

    let weekLabel = isThisWeek ? 'This Week' : (currentWeekOffset > 0 ? `+${currentWeekOffset} week${currentWeekOffset > 1 ? 's' : ''}` : `${currentWeekOffset} week${currentWeekOffset < -1 ? 's' : ''}`);
    let refLabel = refWeek ? ` (Plan Wk ${refWeek})` : '';

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

      const card = document.createElement('div');
      card.className = `day-card${isToday ? ' today' : ''}`;
      card.dataset.dayIndex = i;

      card.innerHTML = `
        <div class="day-card-header">
          <span class="day-name">${days[i]}</span>
          <span style="display:flex;align-items:center;gap:8px;">
            <span class="day-date">${formatDateShort(dayDate)}</span>
            ${dayWorkouts.length > 0 ? `<button class="btn-clear-day" data-day="${i}" title="Clear day"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg></button>` : ''}
          </span>
        </div>
        <div class="day-card-body${dayWorkouts.length === 0 ? ' empty' : ''}" data-day="${i}">
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
    const dur = w.planned_duration_hours;
    let durStr = '';
    if (dur) {
      const h = Math.floor(dur);
      const m = Math.round((dur - h) * 60);
      durStr = h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
    }
    const meta = [durStr, w.reference_code].filter(Boolean).join(' · ');

    return `
      <div class="workout-card${w.completed ? ' completed' : ''}" data-id="${w.id}">
        <div class="workout-type-icon ${w.type}">${icon}</div>
        <div class="workout-info" data-id="${w.id}">
          <div class="workout-title">${escapeHtml(w.title)}</div>
          ${meta ? `<div class="workout-meta">${meta}</div>` : ''}
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
  }

  function openWorkoutDetail(workoutId) {
    const w = workouts.find(x => x.id === workoutId);
    if (!w) return;
    showWorkoutDetailModal(w);
  }

  function showWorkoutDetailModal(w) {
    const overlay = document.getElementById('workout-detail-overlay');
    const body = document.getElementById('workout-detail-body');

    let html = `<div class="workout-detail-section" style="margin-bottom:12px;"><h4>Title</h4>`;
    html += `<input type="text" class="notes-field" id="detail-title" value="${escapeHtml(w.title)}" style="min-height:auto;padding:8px 12px;font-weight:600;font-size:15px;"></div>`;
    html += `<div class="workout-detail-type">${w.type}</div>`;

    if (w.description) {
      html += `<div class="workout-detail-section"><h4>Workout</h4><p>${escapeHtml(w.description)}</p></div>`;
    }

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

  function openAddWorkoutSheet() {
    const overlay = document.getElementById('add-workout-overlay');
    const refSection = document.getElementById('reference-workouts-list');

    const monday = getCurrentMonday();
    const refWeekNum = getReferenceWeekForDate(monday);
    const refWeek = refWeekNum ? ReferenceData.weeks[refWeekNum - 1] : null;

    refSection.innerHTML = '';
    if (refWeek) {
      // Filter to only coded workouts and store direct references
      const codedWorkouts = refWeek.workouts.filter(w => w.code);

      codedWorkouts.forEach((w, idx) => {
        const dur = w.planned_duration_hours;
        let durStr = '';
        if (dur) {
          const h = Math.floor(dur);
          const m = Math.round((dur - h) * 60);
          durStr = h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
        }
        const item = document.createElement('div');
        item.className = 'reference-workout-item';
        item.dataset.refIdx = idx;
        item.innerHTML = `
          <div class="workout-type-icon run">${WORKOUT_ICONS.run}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:500;">${escapeHtml(w.title)}</div>
            <div style="font-size:11px;color:var(--text-secondary);">${[durStr, w.workout_type].filter(Boolean).join(' · ')}</div>
          </div>
        `;
        refSection.appendChild(item);
      });

      // Single delegated click handler — opens preview with Add button
      refSection.onclick = (e) => {
        const item = e.target.closest('.reference-workout-item');
        if (!item || item.style.pointerEvents === 'none') return;
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(item.dataset.refIdx);
        if (idx >= 0 && idx < codedWorkouts.length) {
          showReferencePreview(codedWorkouts[idx], item);
        }
      };
    } else {
      refSection.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:8px">No reference plan mapped to this week</p>';
    }

    overlay.classList.remove('hidden');
  }

  function addReferenceWorkout(refWorkout, titleOverride) {
    const monday = getCurrentMonday();
    const weekId = getWeekId(monday);
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + activeDay);

    const existing = workouts.filter(w => w.day_index === activeDay);

    // Store structure as JSON string to avoid Firestore nested array limitation
    let structureJson = null;
    if (refWorkout.structure) {
      try { structureJson = JSON.stringify(refWorkout.structure); } catch(e) { structureJson = null; }
    }

    const data = {
      week_id: weekId,
      day_index: activeDay,
      date: formatDate(dayDate),
      order_index: existing.length,
      type: 'run',
      title: titleOverride || refWorkout.title || refWorkout.code + ' (' + refWorkout.workout_type + ')',
      source: 'reference',
      reference_code: refWorkout.code ? refWorkout.code : null,
      description: refWorkout.description ? refWorkout.description : null,
      coach_comments: refWorkout.coach_comments ? refWorkout.coach_comments : null,
      planned_duration_hours: typeof refWorkout.planned_duration_hours === 'number' ? refWorkout.planned_duration_hours : null,
      planned_tss: typeof refWorkout.planned_tss === 'number' ? refWorkout.planned_tss : null,
      structure: structureJson,
      notes: null
    };

    console.log('Adding reference workout:', data.title, 'to week:', weekId, 'day:', activeDay);

    Store.createWorkout(data).then(() => {
      console.log('Reference workout added successfully');
    }).catch(err => {
      console.error('Failed to add reference workout:', err);
      alert('Failed to add workout: ' + err.message);
    });
  }

  function showReferencePreview(refWorkout, itemEl) {
    // Hide add-workout sheet, show detail with Add button
    document.getElementById('add-workout-overlay').classList.add('hidden');

    const overlay = document.getElementById('workout-detail-overlay');
    const body = document.getElementById('workout-detail-body');

    let html = `<div class="workout-detail-title">${escapeHtml(refWorkout.title)}</div>`;
    html += `<div class="workout-detail-type">run</div>`;

    if (refWorkout.description) {
      html += `<div class="workout-detail-section"><h4>Workout</h4><p>${escapeHtml(refWorkout.description)}</p></div>`;
    }

    if (refWorkout.structure && refWorkout.structure.structure) {
      html += `<div class="workout-detail-section"><h4>Structure</h4><div class="zone-pills">`;
      refWorkout.structure.structure.forEach(block => {
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

    if (refWorkout.coach_comments) {
      html += `<div class="workout-detail-section"><h4>Coach Notes</h4><p>${escapeHtml(refWorkout.coach_comments)}</p></div>`;
    }

    html += `<div class="workout-detail-section"><h4>Title</h4>`;
    html += `<input type="text" class="notes-field" id="ref-preview-title" value="${escapeHtml(refWorkout.title)}" style="min-height:auto;padding:8px 12px;"></div>`;

    html += `<div style="display:flex;gap:8px;margin-top:16px;">`;
    html += `<button class="btn-primary" id="ref-preview-add" style="flex:1;">Add to day</button>`;
    html += `<button class="btn-danger" id="ref-preview-close" style="flex:1;margin-top:0;border-color:var(--border);color:var(--text-secondary);">Close</button>`;
    html += `</div>`;

    body.innerHTML = html;
    overlay.classList.remove('hidden');

    document.getElementById('ref-preview-add').addEventListener('click', () => {
      const customTitle = document.getElementById('ref-preview-title').value.trim();
      const titleOverride = customTitle && customTitle !== refWorkout.title ? customTitle : null;
      addReferenceWorkout(refWorkout, titleOverride);
      if (itemEl) { itemEl.style.opacity = '0.4'; itemEl.style.pointerEvents = 'none'; }
      overlay.classList.add('hidden');
    });

    document.getElementById('ref-preview-close').addEventListener('click', () => {
      overlay.classList.add('hidden');
      // Re-open the add workout sheet
      openAddWorkoutSheet();
    });
  }

  function addCustomWorkout(type) {
    const titles = { strength: 'Strength Training', yoga: 'Yoga', cycling: 'Cycling', hiking: 'Hiking', canicross: 'Canicross' };
    const defaultTitle = titles[type] || type;

    document.getElementById('add-workout-overlay').classList.add('hidden');

    const overlay = document.getElementById('workout-detail-overlay');
    const body = document.getElementById('workout-detail-body');

    let html = `<div class="workout-detail-type">${type}</div>`;
    html += `<div class="workout-detail-section"><h4>Title</h4>`;
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
    document.getElementById('settings-ref-week').value = config.current_reference_week || 1;
    updateSettingsEndDate(config.current_reference_week || 1);
    overlay.classList.remove('hidden');

    document.getElementById('settings-ref-week').addEventListener('input', (e) => {
      updateSettingsEndDate(parseInt(e.target.value) || 1);
    });

    document.getElementById('settings-save').onclick = async () => {
      const newWeek = parseInt(document.getElementById('settings-ref-week').value);
      if (newWeek >= 1 && newWeek <= ReferenceData.weeks.length) {
        config.current_reference_week = newWeek;
        config.reference_week_anchor = formatDate(getMonday(new Date()));
        await Store.saveConfig(config);
        overlay.classList.add('hidden');
        loadWeek();
      }
    };
  }

  function updateSettingsEndDate(weekNum) {
    const el = document.getElementById('settings-end-date');
    if (!el) return;
    const weeksRemaining = ReferenceData.weeks.length - weekNum;
    const endDate = new Date();
    const monday = getMonday(endDate);
    monday.setDate(monday.getDate() + (weeksRemaining * 7) + 6);
    el.textContent = `Plan ends: ${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (${weeksRemaining} weeks from now)`;
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
