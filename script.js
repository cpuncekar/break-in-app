// BrakeCycle MVP
// Simple manual-guided brake break-in app

let selectedProcedure = null;
let currentCycle = 1;
let currentStep = 0;
let totalCycles = 20;
let startTime = null;
let timer = null;
let timerSeconds = 10;
let isPaused = false;

const procedures = {
  recommended: {
    name: "Recommended Break-In",
    cycles: 20,
    steps: [
      "Drive to 20 mph",
      "Lightly brake down to 5 mph",
      "Coast for 10 seconds",
      "Accelerate back to 20 mph"
    ]
  },
  minimum: {
    name: "Minimum Break-In",
    cycles: 10,
    steps: [
      "Drive to 10 mph",
      "Brake lightly",
      "Rest or coast for 10 seconds"
    ]
  }
};

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(screenId).classList.add("active");
}

function selectProcedure(type) {
  selectedProcedure = procedures[type];
  totalCycles = selectedProcedure.cycles;
  currentCycle = 1;
  currentStep = 0;
  startTime = null;

  saveProgress();
  showScreen("safetyScreen");
}

function startProcedure() {
  startTime = Date.now();
  updateGuideScreen();
  saveProgress();
  showScreen("guideScreen");
}

function beginStep() {
  if (!startTime) {
    startTime = Date.now();
  }

  updateGuideScreen();
  saveProgress();
}

function nextStep() {
  clearInterval(timer);
  timerSeconds = 10;

  currentStep++;

  if (currentStep >= selectedProcedure.steps.length) {
    currentStep = 0;
    currentCycle++;
  }

  if (currentCycle > totalCycles) {
    completeProcedure();
    return;
  }

  updateGuideScreen();
  saveProgress();
}

function updateGuideScreen() {
  document.getElementById("procedureName").textContent = selectedProcedure.name;
  document.getElementById("cycleText").textContent =
    `Cycle ${currentCycle} of ${totalCycles}`;

  const instruction = selectedProcedure.steps[currentStep];
  document.getElementById("instructionText").textContent = instruction;

  const isTimedStep =
    instruction.toLowerCase().includes("coast") ||
    instruction.toLowerCase().includes("rest");

  if (isTimedStep) {
    startCountdown();
  } else {
    document.getElementById("timerText").textContent = "—";
  }
}

function startCountdown() {
  clearInterval(timer);
  timerSeconds = 10;
  isPaused = false;

  document.getElementById("timerText").textContent = timerSeconds;

  timer = setInterval(() => {
    if (!isPaused) {
      timerSeconds--;
      document.getElementById("timerText").textContent = timerSeconds;

      if (timerSeconds <= 0) {
        clearInterval(timer);
        notifyUser();
      }
    }
  }, 1000);
}

function pauseTimer() {
  isPaused = !isPaused;
}

function notifyUser() {
  // Vibration works on many mobile browsers
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

  // Simple beep using browser audio
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
    }, 200);
  } catch (error) {
    console.log("Audio notification not supported.");
  }
}

function resetProcedure() {
  clearInterval(timer);
  currentCycle = 1;
  currentStep = 0;
  timerSeconds = 10;
  startTime = Date.now();

  updateGuideScreen();
  saveProgress();
}

function completeProcedure() {
  clearInterval(timer);

  const elapsedMs = Date.now() - startTime;
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));

  document.getElementById("completeSummary").innerHTML = `
    <strong>${selectedProcedure.name}</strong><br>
    Cycles completed: ${Math.min(currentCycle, totalCycles)} of ${totalCycles}<br>
    Approximate time: ${elapsedMinutes} minute(s)
  `;

  localStorage.removeItem("brakeCycleProgress");
  showScreen("completeScreen");
}

function goHome() {
  clearInterval(timer);
  localStorage.removeItem("brakeCycleProgress");
  showScreen("homeScreen");
}

function saveProgress() {
  const progress = {
    selectedProcedure,
    currentCycle,
    currentStep,
    totalCycles,
    startTime
  };

  localStorage.setItem("brakeCycleProgress", JSON.stringify(progress));
}

function loadProgress() {
  const saved = localStorage.getItem("brakeCycleProgress");

  if (!saved) return;

  const progress = JSON.parse(saved);

  if (progress.selectedProcedure) {
    selectedProcedure = progress.selectedProcedure;
    currentCycle = progress.currentCycle;
    currentStep = progress.currentStep;
    totalCycles = progress.totalCycles;
    startTime = progress.startTime;

    updateGuideScreen();
    showScreen("guideScreen");
  }
}

loadProgress();
