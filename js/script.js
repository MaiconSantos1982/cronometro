let timer = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;

function startPause() {
    const playPauseIcon = document.getElementById('playPauseIcon');
    
    if (!isRunning) {
        // Start
        startTime = Date.now() - elapsedTime;
        timer = setInterval(updateDisplay, 10);
        isRunning = true;
        playPauseIcon.className = 'bi bi-pause-fill';
    } else {
        // Pause
        clearInterval(timer);
        isRunning = false;
        playPauseIcon.className = 'bi bi-play-fill';
    }
}

function stop() {
    clearInterval(timer);
    isRunning = false;
    elapsedTime = 0;
    updateDisplay();
    document.getElementById('playPauseIcon').className = 'bi bi-play-fill';
}

function reset() {
    clearInterval(timer);
    elapsedTime = 0;
    isRunning = true;
    startTime = Date.now();
    timer = setInterval(updateDisplay, 10);
    document.getElementById('playPauseIcon').className = 'bi bi-pause-fill';
}

function updateDisplay() {
    if (isRunning) {
        elapsedTime = Date.now() - startTime;
    }
    
    const totalMilliseconds = Math.floor(elapsedTime);
    const minutes = Math.floor(totalMilliseconds / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
    
    document.getElementById('minutes').textContent = pad(minutes);
    document.getElementById('seconds').textContent = pad(seconds);
    document.getElementById('milliseconds').textContent = pad(milliseconds);
}

function pad(number) {
    return number.toString().padStart(2, '0');
}

// Inicializar display
updateDisplay();
