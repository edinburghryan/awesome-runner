const Store = (() => {
  const weeksRef = db.collection('tp_weeks');
  const workoutsRef = db.collection('tp_workouts');
  const racesRef = db.collection('tp_races');
  const configRef = db.collection('tp_config');

  // --- Config ---
  async function getConfig() {
    const doc = await configRef.doc('app').get();
    return doc.exists ? doc.data() : {};
  }

  async function saveConfig(data) {
    return configRef.doc('app').set(data, { merge: true });
  }

  // --- Weeks ---
  async function getWeek(weekId) {
    const doc = await weeksRef.doc(weekId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async function createWeek(weekId, data) {
    return weeksRef.doc(weekId).set({
      ...data,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function updateWeek(weekId, data) {
    return weeksRef.doc(weekId).update(data);
  }

  // --- Workouts ---
  function onWorkoutsForWeek(weekId, callback) {
    return workoutsRef
      .where('week_id', '==', weekId)
      .orderBy('day_index')
      .orderBy('order_index')
      .onSnapshot(snapshot => {
        const workouts = [];
        snapshot.forEach(doc => workouts.push({ id: doc.id, ...doc.data() }));
        callback(workouts);
      });
  }

  async function getWorkoutsForWeek(weekId) {
    const snapshot = await workoutsRef
      .where('week_id', '==', weekId)
      .orderBy('day_index')
      .orderBy('order_index')
      .get();
    const workouts = [];
    snapshot.forEach(doc => workouts.push({ id: doc.id, ...doc.data() }));
    return workouts;
  }

  async function createWorkout(data) {
    return workoutsRef.add({
      ...data,
      completed: false,
      completed_at: null,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function updateWorkout(id, data) {
    return workoutsRef.doc(id).update(data);
  }

  async function deleteWorkout(id) {
    return workoutsRef.doc(id).delete();
  }

  async function batchUpdateWorkouts(updates) {
    const batch = db.batch();
    updates.forEach(({ id, data }) => {
      batch.update(workoutsRef.doc(id), data);
    });
    return batch.commit();
  }

  // --- Races ---
  function onRacesChanged(callback) {
    return racesRef.orderBy('date').onSnapshot(snapshot => {
      const races = [];
      snapshot.forEach(doc => races.push({ id: doc.id, ...doc.data() }));
      callback(races);
    });
  }

  async function createRace(data) {
    return racesRef.add({
      ...data,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function updateRace(id, data) {
    return racesRef.doc(id).update(data);
  }

  async function deleteRace(id) {
    return racesRef.doc(id).delete();
  }

  return {
    getConfig, saveConfig,
    getWeek, createWeek, updateWeek,
    onWorkoutsForWeek, getWorkoutsForWeek, createWorkout, updateWorkout, deleteWorkout, batchUpdateWorkouts,
    onRacesChanged, createRace, updateRace, deleteRace
  };
})();
