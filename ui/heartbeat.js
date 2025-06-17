// 📁 /js/ui/heartbeat.js

let heartbeatInterval = null;

export function startHeartbeat(lastUpdateTime) {
  const timerDisplay = document.getElementById("timer");
  const beatCircle = document.getElementById("beat");

  if (!timerDisplay || !beatCircle) {
    console.warn("⚠️ Heartbeat UI elements missing");
    return;
  }

  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = setInterval(() => {
    const secondsElapsed = Math.floor((Date.now() - lastUpdateTime) / 1000);
    const minutes = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const seconds = String(secondsElapsed % 60).padStart(2, '0');
    timerDisplay.textContent = `⏳ Time since last update: ${minutes}:${seconds}`;

    // Pulse beat
    beatCircle.style.background = beatCircle.style.background === 'lime' ? 'grey' : 'lime';
  }, 1000);
}
