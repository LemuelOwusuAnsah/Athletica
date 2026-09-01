(function() {
    const timeDisplay = document.getElementById('timeDisplay');
    const startBtn = document.getElementById('startBtn');
    const lapBtn = document.getElementById('lapBtn');
    const resetBtn = document.getElementById('resetBtn');
    const lapBody = document.getElementById('lapBody');
    const lapCount = document.getElementById('lapCount');
    const fastestLap = document.getElementById('fastestLap');
    const slowestLap = document.getElementById('slowestLap');
    const copyLapsBtn = document.getElementById('copyLapsBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const soundToggle = document.getElementById('soundToggle');

    let isRunning = false;
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let laps = [];
    let lapStartTime = 0;
    let isSoundOn = true;

    const STORAGE_KEY = 'calendria_stopwatch_data';

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                elapsedTime = data.elapsedTime || 0;
                laps = data.laps || [];
                if (data.isRunning) {
                    startTime = Date.now() - elapsedTime;
                    isRunning = true;
                    startTimer();
                }
                renderLaps();
                updateDisplay();
                updateButtons();
                updateStats();
            }
        } catch (e) {
            console.log('No saved state');
        }
    }

    function saveState() {
        const data = {
            elapsedTime: elapsedTime,
            laps: laps,
            isRunning: isRunning
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.log('Could not save state');
        }
    }

    function formatTime(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        return String(hours).padStart(2, '0') + ':' +
               String(minutes).padStart(2, '0') + ':' +
               String(seconds).padStart(2, '0') + '.' +
               String(milliseconds).padStart(3, '0');
    }

    function updateDisplay() {
        timeDisplay.textContent = formatTime(elapsedTime);
        if (isRunning) {
            timeDisplay.className = 'time-display running';
        } else if (elapsedTime > 0) {
            timeDisplay.className = 'time-display paused';
        } else {
            timeDisplay.className = 'time-display';
        }
    }

    function updateButtons() {
        if (isRunning) {
            startBtn.innerHTML = '<i class="bi bi-stop-fill"></i> Stop';
            startBtn.className = 'btn-start running';
            lapBtn.disabled = false;
            resetBtn.disabled = true;
        } else {
            if (elapsedTime > 0) {
                startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Resume';
                startBtn.className = 'btn-start';
                resetBtn.disabled = false;
            } else {
                startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
                startBtn.className = 'btn-start';
                resetBtn.disabled = true;
            }
            lapBtn.disabled = true;
        }
        copyLapsBtn.disabled = laps.length === 0;
    }

    function startTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(function() {
            elapsedTime = Date.now() - startTime;
            updateDisplay();
            saveState();
        }, 10);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        saveState();
    }

    function toggleStart() {
        if (isRunning) {
            stopTimer();
            isRunning = false;
            playSound('stop');
        } else {
            startTime = Date.now() - elapsedTime;
            isRunning = true;
            startTimer();
            playSound('start');
        }
        updateButtons();
        updateDisplay();
        saveState();
    }

    function recordLap() {
        if (!isRunning) return;
        const currentTime = elapsedTime;
        const lapTime = currentTime - lapStartTime;
        laps.push({
            time: currentTime,
            lapTime: lapTime
        });
        lapStartTime = currentTime;
        renderLaps();
        updateStats();
        updateButtons();
        saveState();
        playSound('lap');
        if (laps.length > 0) {
            lapBody.lastElementChild.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
    }

    function resetStopwatch() {
        stopTimer();
        isRunning = false;
        elapsedTime = 0;
        laps = [];
        lapStartTime = 0;
        renderLaps();
        updateDisplay();
        updateButtons();
        updateStats();
        saveState();
        playSound('reset');
    }

    function renderLaps() {
        lapBody.innerHTML = '';
        if (laps.length === 0) {
            lapCount.textContent = '0';
            return;
        }

        let fastestIndex = -1;
        let slowestIndex = -1;
        let fastestTime = Infinity;
        let slowestTime = -Infinity;

        laps.forEach(function(lap, index) {
            if (lap.lapTime < fastestTime) {
                fastestTime = lap.lapTime;
                fastestIndex = index;
            }
            if (lap.lapTime > slowestTime) {
                slowestTime = lap.lapTime;
                slowestIndex = index;
            }
        });

        laps.forEach(function(lap, index) {
            const tr = document.createElement('tr');
            if (index === fastestIndex) {
                tr.className = 'lap-fastest';
            } else if (index === slowestIndex) {
                tr.className = 'lap-slowest';
            }

            const tdNum = document.createElement('td');
            tdNum.className = 'lap-number';
            tdNum.textContent = index + 1;

            const tdTime = document.createElement('td');
            tdTime.textContent = formatTime(lap.lapTime);

            const tdDiff = document.createElement('td');
            if (index === 0) {
                tdDiff.textContent = '--';
            } else {
                const diff = lap.lapTime - laps[index - 1].lapTime;
                const diffText = (diff > 0 ? '+' : '') + formatTime(diff);
                tdDiff.textContent = diffText;
                if (diff > 0) {
                    tdDiff.className = 'lap-diff-positive';
                } else if (diff < 0) {
                    tdDiff.className = 'lap-diff-negative';
                }
            }

            tr.appendChild(tdNum);
            tr.appendChild(tdTime);
            tr.appendChild(tdDiff);
            lapBody.appendChild(tr);
        });

        lapCount.textContent = laps.length;
    }

    function updateStats() {
        if (laps.length === 0) {
            fastestLap.textContent = '--';
            slowestLap.textContent = '--';
            return;
        }

        let fastestTime = Infinity;
        let slowestTime = -Infinity;

        laps.forEach(function(lap) {
            if (lap.lapTime < fastestTime) fastestTime = lap.lapTime;
            if (lap.lapTime > slowestTime) slowestTime = lap.lapTime;
        });

        fastestLap.textContent = formatTime(fastestTime);
        slowestLap.textContent = formatTime(slowestTime);
    }

    function copyLaps() {
        if (laps.length === 0) return;
        let text = 'Calendria Stopwatch - Lap Times\n';
        text += '='.repeat(30) + '\n\n';
        laps.forEach(function(lap, index) {
            const diff = index === 0 ? '--' : formatTime(lap.lapTime - laps[index - 1].lapTime);
            text += 'Lap ' + (index + 1) + ': ' + formatTime(lap.lapTime) + ' (Diff: ' + diff + ')\n';
        });
        text += '\n' + '='.repeat(30) + '\n';
        text += 'Total Time: ' + formatTime(elapsedTime) + '\n';
        text += 'Total Laps: ' + laps.length;

        navigator.clipboard.writeText(text).then(function() {
            const originalText = copyLapsBtn.innerHTML;
            copyLapsBtn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
            setTimeout(function() {
                copyLapsBtn.innerHTML = originalText;
            }, 2000);
        }).catch(function() {
            alert('Could not copy. Please select and copy manually.');
        });
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(function() {});
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    function toggleSound() {
        isSoundOn = !isSoundOn;
        soundToggle.innerHTML = isSoundOn ? '<i class="bi bi-volume-up-fill"></i>' : '<i class="bi bi-volume-mute-fill"></i>';
    }

    function playSound(type) {
        if (!isSoundOn) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            if (type === 'start') {
                oscillator.frequency.value = 880;
                gainNode.gain.value = 0.3;
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.1);
            } else if (type === 'stop') {
                oscillator.frequency.value = 440;
                gainNode.gain.value = 0.3;
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.15);
            } else if (type === 'lap') {
                oscillator.frequency.value = 660;
                gainNode.gain.value = 0.2;
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.08);
                setTimeout(function() {
                    const osc2 = audioCtx.createOscillator();
                    const gain2 = audioCtx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioCtx.destination);
                    osc2.frequency.value = 880;
                    gain2.gain.value = 0.2;
                    osc2.start(audioCtx.currentTime);
                    osc2.stop(audioCtx.currentTime + 0.08);
                }, 100);
            } else if (type === 'reset') {
                oscillator.frequency.value = 330;
                gainNode.gain.value = 0.2;
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.2);
            }
        } catch (e) {
        }
    }

    startBtn.addEventListener('click', toggleStart);
    lapBtn.addEventListener('click', recordLap);
    resetBtn.addEventListener('click', resetStopwatch);
    copyLapsBtn.addEventListener('click', copyLaps);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    soundToggle.addEventListener('click', toggleSound);

    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            toggleStart();
        } else if (e.key === 'l' || e.key === 'L') {
            if (!lapBtn.disabled) recordLap();
        } else if (e.key === 'r' || e.key === 'R') {
            if (!resetBtn.disabled) resetStopwatch();
        }
    });

    loadState();

    document.addEventListener('DOMContentLoaded', function() {
        const htmlEl = document.documentElement;
        const themeToggle = document.createElement('button');
        themeToggle.className = 'btn btn-outline-secondary btn-sm position-fixed bottom-0 end-0 m-3 rounded-circle';
        themeToggle.style.width = '44px';
        themeToggle.style.height = '44px';
        themeToggle.style.zIndex = '1050';
        themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
        themeToggle.setAttribute('aria-label', 'Toggle dark mode');
        document.body.appendChild(themeToggle);

        themeToggle.addEventListener('click', function() {
            const currentTheme = htmlEl.getAttribute('data-bs-theme');
            if (currentTheme === 'dark') {
                htmlEl.setAttribute('data-bs-theme', 'light');
                themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
            } else {
                htmlEl.setAttribute('data-bs-theme', 'dark');
                themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
            }
        });
    });
})();