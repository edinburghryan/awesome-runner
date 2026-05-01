const Races = (() => {
  let races = [];

  const RACE_TYPES = {
    '5k': '5K',
    '10k': '10K',
    'half_marathon': 'Half Marathon',
    'marathon': 'Marathon',
    'ultra': 'Ultra'
  };

  function render(newRaces) {
    races = newRaces;
    const container = document.getElementById('races-list');
    const now = new Date();

    if (races.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;font-size:13px;">No races added yet</p>';
      return;
    }

    container.innerHTML = races.map(r => {
      const raceDate = r.date ? r.date.toDate() : new Date();
      const isPast = raceDate < now;
      const totalDays = Math.floor((raceDate - now) / 86400000);
      let countdownStr;
      if (isPast) countdownStr = 'Done';
      else if (totalDays === 0) countdownStr = 'Today';
      else if (totalDays < 7) countdownStr = `${totalDays}d`;
      else { const w = Math.floor(totalDays / 7); const d = totalDays % 7; countdownStr = d ? `${w}w ${d}d` : `${w}w`; }
      const typeLabel = RACE_TYPES[r.race_type] || r.race_type || '';
      const distLabel = r.distance_km ? `${r.distance_km}km` : '';
      const detail = [typeLabel, distLabel].filter(Boolean).join(' · ');
      const dateStr = raceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      return `
        <div class="race-item" data-id="${r.id}">
          <div class="race-item-info">
            <div class="race-item-name">${escapeHtml(r.name)}</div>
            <div class="race-item-detail">${dateStr} · ${detail}</div>
          </div>
          <div class="race-item-countdown">${countdownStr}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.race-item').forEach(el => {
      el.addEventListener('click', () => openRaceDetail(el.dataset.id));
    });
  }

  function openRaceDetail(raceId) {
    const race = races.find(r => r.id === raceId);
    if (!race) return;

    const overlay = document.getElementById('race-form-overlay');
    document.getElementById('race-form-title').textContent = 'Edit Race';
    document.getElementById('race-name').value = race.name || '';
    document.getElementById('race-type').value = race.race_type || 'ultra';
    document.getElementById('race-distance').value = race.distance_km || '';
    document.getElementById('race-notes').value = race.notes || '';

    const raceDate = race.date ? race.date.toDate() : new Date();
    document.getElementById('race-date').value = raceDate.toISOString().split('T')[0];

    document.getElementById('race-form-delete').classList.remove('hidden');
    overlay.classList.remove('hidden');

    document.getElementById('race-form-save').onclick = () => saveRace(raceId);
    document.getElementById('race-form-delete').onclick = () => {
      Store.deleteRace(raceId);
      overlay.classList.add('hidden');
    };
  }

  function openNewRace() {
    const overlay = document.getElementById('race-form-overlay');
    document.getElementById('race-form-title').textContent = 'Add Race';
    document.getElementById('race-name').value = '';
    document.getElementById('race-type').value = 'ultra';
    document.getElementById('race-distance').value = '';
    document.getElementById('race-date').value = '';
    document.getElementById('race-notes').value = '';
    document.getElementById('race-form-delete').classList.add('hidden');
    overlay.classList.remove('hidden');

    document.getElementById('race-form-save').onclick = () => saveRace(null);
  }

  function saveRace(existingId) {
    const name = document.getElementById('race-name').value.trim();
    const dateVal = document.getElementById('race-date').value;
    if (!name || !dateVal) return;

    const data = {
      name,
      date: firebase.firestore.Timestamp.fromDate(new Date(dateVal + 'T00:00:00')),
      race_type: document.getElementById('race-type').value,
      distance_km: parseFloat(document.getElementById('race-distance').value) || null,
      notes: document.getElementById('race-notes').value.trim() || null
    };

    if (existingId) {
      Store.updateRace(existingId, data);
    } else {
      Store.createRace(data);
    }

    document.getElementById('race-form-overlay').classList.add('hidden');
  }

  function init() {
    document.getElementById('btn-add-race').addEventListener('click', openNewRace);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { render, init };
})();
