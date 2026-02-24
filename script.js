// State
const config = {
  sets: [{ name: "Set 1", workTime: 10, restTime: 20, reps: 10 }]
};

let timerState = {
  running: false,
  paused: false,
  currentSetIndex: 0,
  currentRep: 1,
  phase: "ready", // ready, work, rest
  secondsLeft: 5,
  intervalId: null
};

let wakeLock = null;

// DOM Elements
const setupScreen = document.getElementById("setup-screen");
const timerScreen = document.getElementById("timer-screen");
const completeScreen = document.getElementById("complete-screen");
const setsList = document.getElementById("sets-list");
const addSetBtn = document.getElementById("add-set-btn");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const restartBtn = document.getElementById("restart-btn");

const setNameEl = document.getElementById("set-name");
const phaseEl = document.getElementById("phase");
const countdownEl = document.getElementById("countdown");
const progressEl = document.getElementById("progress");

// Audio Context
let audioContext = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playBeep(frequency, duration) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function playCountdownBeep() {
  playBeep(800, 0.1);
}

function playRepComplete() {
  playBeep(600, 0.2);
}

function playSetComplete() {
  playBeep(400, 0.15);
  setTimeout(() => playBeep(400, 0.15), 200);
}

// Wake Lock
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    console.error('Wake Lock error:', err);
  }
}

async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}

async function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && timerState.running && !timerState.paused) {
    await requestWakeLock();
  }
}

// URL State Management
function minifyConfig(config) {
  return {
    s: config.sets.map(set => ({
      n: set.name,
      w: set.workTime,
      rt: set.restTime,
      rp: set.reps
    }))
  };
}

function expandConfig(minified) {
  return {
    sets: minified.s.map(set => ({
      name: set.n,
      workTime: set.w,
      restTime: set.rt,
      reps: set.rp
    }))
  };
}

function saveToUrl() {
  const encoded = btoa(JSON.stringify(minifyConfig(config)));
  console.log(encoded)
  const url = new URL(window.location);
  console.log(url)
  url.searchParams.set("c", encoded);
  window.history.replaceState({}, "", url);
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("c");
  if (encoded) {
    try {
      const decoded = JSON.parse(atob(encoded));
      if (decoded.s && Array.isArray(decoded.s)) {
        config.sets = expandConfig(decoded).sets;
      } else if (decoded.sets && Array.isArray(decoded.sets)) {
        config.sets = decoded.sets;
      }
    } catch (e) {
      console.error("Failed to load config from URL:", e);
    }
  }
}

// Set Management
function createSetCard(set, index) {
  const card = document.createElement("div");
  card.className = "set-card";
  card.dataset.index = index;

  card.innerHTML = `
    <div class="set-header">
      <div class="set-move-buttons">
        <button type="button" class="btn btn-small move-btn move-up-btn" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="btn btn-small move-btn move-down-btn" ${index === config.sets.length - 1 ? 'disabled' : ''}>↓</button>
      </div>
      <input type="text" class="set-name-input" value="${set.name}" placeholder="Set name">
      ${config.sets.length > 1 ? '<button type="button" class="btn btn-danger btn-small remove-set-btn">✕</button>' : ''}
    </div>
    <div class="set-config">
      <div class="config-field">
        <label>Work (s)</label>
        <input type="number" class="work-input" value="${set.workTime}" min="1" max="999">
      </div>
      <div class="config-field">
        <label>Rest (s)</label>
        <input type="number" class="rest-input" value="${set.restTime}" min="0" max="999">
      </div>
      <div class="config-field">
        <label>Reps</label>
        <input type="number" class="reps-input" value="${set.reps}" min="1" max="999">
      </div>
    </div>
  `;

  // Event listeners
  card.querySelector(".set-name-input").addEventListener("input", (e) => {
    config.sets[index].name = e.target.value;
  });

  card.querySelector(".work-input").addEventListener("input", (e) => {
    config.sets[index].workTime = parseInt(e.target.value) || 10;
  });

  card.querySelector(".rest-input").addEventListener("input", (e) => {
    config.sets[index].restTime = parseInt(e.target.value) || 0;
  });

  card.querySelector(".reps-input").addEventListener("input", (e) => {
    config.sets[index].reps = parseInt(e.target.value) || 1;
  });

  const removeBtn = card.querySelector(".remove-set-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      config.sets.splice(index, 1);
      renderSets();
    });
  }

  const moveUpBtn = card.querySelector(".move-up-btn");
  if (moveUpBtn) {
    moveUpBtn.addEventListener("click", () => {
      if (index > 0) {
        const temp = config.sets[index];
        config.sets[index] = config.sets[index - 1];
        config.sets[index - 1] = temp;
        renderSets();
      }
    });
  }

  const moveDownBtn = card.querySelector(".move-down-btn");
  if (moveDownBtn) {
    moveDownBtn.addEventListener("click", () => {
      if (index < config.sets.length - 1) {
        const temp = config.sets[index];
        config.sets[index] = config.sets[index + 1];
        config.sets[index + 1] = temp;
        renderSets();
      }
    });
  }

  return card;
}

function renderSets() {
  setsList.innerHTML = "";
  config.sets.forEach((set, index) => {
    setsList.appendChild(createSetCard(set, index));
  });
}

function addSet() {
  const lastSet = config.sets[config.sets.length - 1];
  config.sets.push({
    name: `Set ${config.sets.length + 1}`,
    workTime: lastSet.workTime,
    restTime: lastSet.restTime,
    reps: lastSet.reps
  });
  renderSets();
}

// Timer Logic
function showScreen(screen) {
  setupScreen.classList.add("hidden");
  timerScreen.classList.add("hidden");
  completeScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

function updateTimerDisplay() {
  const currentSet = config.sets[timerState.currentSetIndex];

  if (timerState.phase === "rest" && timerState.currentRep === currentSet.reps && timerState.currentSetIndex < config.sets.length - 1) {
    const nextSet = config.sets[timerState.currentSetIndex + 1];
    setNameEl.textContent = `Upcoming: ${nextSet.name}`;
  } else if (timerState.phase === "rest" && timerState.currentRep === currentSet.reps && timerState.currentSetIndex === config.sets.length - 1) {
    setNameEl.textContent = "Last Set";
  } else {
    setNameEl.textContent = currentSet.name;
  }

  phaseEl.textContent = timerState.phase === "ready" ? "GET READY" : timerState.phase.toUpperCase();
  phaseEl.className = "phase " + timerState.phase;

  countdownEl.textContent = timerState.secondsLeft;

  progressEl.textContent = `Rep ${timerState.currentRep}/${currentSet.reps} - Set ${timerState.currentSetIndex + 1}/${config.sets.length}`;
}

function nextPhase() {
  const currentSet = config.sets[timerState.currentSetIndex];

  if (timerState.phase === "ready") {
    timerState.phase = "work";
    timerState.secondsLeft = currentSet.workTime;
  } else if (timerState.phase === "work") {
    // Check if this is the last rep of the current set
    const isLastRepOfSet = timerState.currentRep === currentSet.reps;

    if (isLastRepOfSet) {
      playSetComplete();
    } else {
      playRepComplete();
    }

    // Check if this is the last rep of the last set
    const isLastRepOfLastSet = isLastRepOfSet &&
      timerState.currentSetIndex === config.sets.length - 1;

    if (currentSet.restTime > 0 && !isLastRepOfLastSet) {
      timerState.phase = "rest";
      timerState.secondsLeft = currentSet.restTime;
    } else {
      // No rest time or last rep of last set, go directly to next rep or set
      advanceRep();
    }
  } else if (timerState.phase === "rest") {
    advanceRep();
  }
}

function advanceRep() {
  const currentSet = config.sets[timerState.currentSetIndex];

  if (timerState.currentRep < currentSet.reps) {
    timerState.currentRep++;
    timerState.phase = "work";
    timerState.secondsLeft = currentSet.workTime;
  } else {
    // Set complete - advance to next set or finish

    if (timerState.currentSetIndex < config.sets.length - 1) {
      timerState.currentSetIndex++;
      timerState.currentRep = 1;
      timerState.phase = "work";
      timerState.secondsLeft = config.sets[timerState.currentSetIndex].workTime;
    } else {
      // All done!
      stopTimer();
      showScreen(completeScreen);
      return;
    }
  }
}

function tick() {
  if (timerState.paused) return;

  if (timerState.secondsLeft <= 4 && timerState.secondsLeft > 1) {
    playCountdownBeep();
  }

  if (timerState.secondsLeft <= 1) {
    nextPhase();
  } else {
    timerState.secondsLeft--;
  }

  updateTimerDisplay();
}

function startTimer() {
  initAudio();
  saveToUrl();
  requestWakeLock();

  timerState = {
    running: true,
    paused: false,
    currentSetIndex: 0,
    currentRep: 1,
    phase: "ready",
    secondsLeft: 5,
    intervalId: null
  };

  showScreen(timerScreen);
  updateTimerDisplay();

  timerState.intervalId = setInterval(tick, 1000);
}

function stopTimer() {
  timerState.running = false;
  timerState.paused = false;
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  releaseWakeLock();
}

function pauseTimer() {
  if (!timerState.running) return;

  if (timerState.paused) {
    // Resume
    timerState.paused = false;
    pauseBtn.textContent = "Pause";
    pauseBtn.className = "btn btn-pause";
  } else {
    // Pause
    timerState.paused = true;
    pauseBtn.textContent = "Resume";
    pauseBtn.className = "btn btn-primary";
  }
}

function resetToSetup() {
  stopTimer();
  showScreen(setupScreen);
}

// Event Listeners
addSetBtn.addEventListener("click", addSet);
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
stopBtn.addEventListener("click", resetToSetup);
restartBtn.addEventListener("click", resetToSetup);
document.addEventListener("visibilitychange", handleVisibilityChange);

// Initialize
loadFromUrl();
renderSets();
