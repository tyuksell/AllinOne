/* ════════════════════════════════════════════
   ToStudy – Timer & Pomodoro Module
   ════════════════════════════════════════════ */

const TimerModule = (() => {
    let interval = null;
    let time = 0; // Saniye cinsinden
    let isRunning = false;

    // Mod ve Pomodoro Ayarları
    let mode = 'pomodoro'; // 'stopwatch' veya 'pomodoro'
    let pomoPhase = 'work'; // 'work' veya 'break'
    let WORK_MINS = 25;
    let BREAK_MINS = 5;

    function cleanup() {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }

    function formatTime(s) {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;

        if (hrs > 0) {
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function render(container) {
        // Eğer mod pomodoro ise ve süre 0 ise, başlangıç süresini ayarla
        if (mode === 'pomodoro' && time === 0 && !isRunning) {
            time = (pomoPhase === 'work' ? WORK_MINS : BREAK_MINS) * 60;
        }

        function buildHTML() {
            let labelText = 'KRONOMETRE';
            let labelColor = 'rgba(200, 190, 220, 0.6)';

            if (mode === 'pomodoro') {
                labelText = pomoPhase === 'work' ? 'ÇALIŞMA (Ayarla)' : 'MOLA (Ayarla)';
                labelColor = pomoPhase === 'work' ? 'var(--accent)' : 'var(--success)';
            }

            return `
                <div class="module-title" style="color: var(--accent);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Odaklanma Sayacı
                </div>

                <div class="filter-bar" style="max-width: 320px; margin: 0 auto 20px;">
                    <button class="neu-btn ${mode === 'pomodoro' ? 'active' : ''}" id="mode-pomo" style="flex:1; border-radius: 12px 4px 4px 12px;">Pomodoro</button>
                    <button class="neu-btn ${mode === 'stopwatch' ? 'active' : ''}" id="mode-stopwatch" style="flex:1; border-radius: 4px 12px 12px 4px;">Kronometre</button>
                </div>

                <div class="timer-container">
                    <div class="timer-circle">
                        <div class="timer-display" id="time-display">${formatTime(time)}</div>
                        <div class="timer-label" id="timer-label" style="color: ${labelColor};" title="Süreleri ayarlamak için tıkla">${labelText}</div>

                        <div class="timer-input-overlay" id="timer-settings">
                            <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                                <div style="display:flex; gap:8px; align-items:center;">
                                    <input type="number" id="work-in" value="${WORK_MINS}" min="1" max="90" title="Çalışma Süresi">
                                    <span style="color:white; opacity:0.5;">/</span>
                                    <input type="number" id="break-in" value="${BREAK_MINS}" min="1" max="30" title="Mola Süresi">
                                </div>
                                <button class="neu-btn-icon" id="save-settings" style="color: var(--success); background: rgba(255,255,255,0.1); border-radius: 50%; padding: 8px;">
                                    ${App.svgCheck()}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="timer-controls">
                        <button class="timer-ctrl-btn ${isRunning ? 'play-active' : ''}" id="btn-play-pause">
                            ${isRunning ? App.svgPause() : App.svgPlay()}
                        </button>
                        <button class="timer-ctrl-btn" id="btn-reset">
                            ${App.svgReset()}
                        </button>
                    </div>
                </div>
            `;
        }

        function mount() {
            container.innerHTML = buildHTML();
            attachEvents();
        }

        function updateDisplay() {
            const display = container.querySelector('#time-display');
            if (display) display.textContent = formatTime(time);
        }

        function tick() {
            if (mode === 'stopwatch') {
                time++;
            } else {
                // Pomodoro Geri Sayım Mantığı
                if (time > 0) {
                    time--;
                } else {
                    // SÜRE DOLDU!
                    if (pomoPhase === 'work') {
                        // 1. Durum: Çalışma bitti -> Mola OTOMATİK başlasın
                        pomoPhase = 'break';
                        time = BREAK_MINS * 60;
                        // Mola otomatik başlasın (isRunning=true kalıyor)
                        mount();
                    } else {
                        // 2. Durum: Mola bitti -> Yeni çalışma için ONAY BEKLESİN
                        pomoPhase = 'work';
                        time = WORK_MINS * 60;
                        pause(); // Sayacı durdur (isRunning=false yapar)
                        mount();
                        // Kullanıcıyı bilgilendirmek için opsiyonel küçük bir uyarı
                        console.log("Mola bitti, yeni döngü için hazır mısın?");
                    }
                    return;
                }
            }
            updateDisplay();
        }

        function start() {
            if (!isRunning) {
                isRunning = true;
                interval = setInterval(tick, 1000);
                mount();
            }
        }

        function pause() {
            if (isRunning) {
                isRunning = false;
                clearInterval(interval);
                interval = null;
                mount();
            }
        }

        function toggle() {
            isRunning ? pause() : start();
        }

        function reset() {
            pause();
            if (mode === 'stopwatch') {
                time = 0;
            } else {
                pomoPhase = 'work';
                time = WORK_MINS * 60;
            }
            mount();
        }

        function switchMode(newMode) {
            if (mode === newMode) return;
            pause();
            mode = newMode;
            if (mode === 'stopwatch') {
                time = 0;
            } else {
                pomoPhase = 'work';
                time = WORK_MINS * 60;
            }
            mount();
        }

        function attachEvents() {
            // Kontrol Butonları
            container.querySelector('#btn-play-pause').addEventListener('click', toggle);
            container.querySelector('#btn-reset').addEventListener('click', reset);

            // Mod Değiştirme Butonları
            container.querySelector('#mode-pomo').addEventListener('click', () => switchMode('pomodoro'));
            container.querySelector('#mode-stopwatch').addEventListener('click', () => switchMode('stopwatch'));

            // Ayarlar Overlay'ini Açma (Sadece Pomodoro modunda ve durmuşken açılır)
            const labelEl = container.querySelector('#timer-label');
            const overlayEl = container.querySelector('#timer-settings');

            if (mode === 'pomodoro' && !isRunning) {
                labelEl.style.cursor = 'pointer';
                labelEl.addEventListener('click', () => {
                    overlayEl.classList.add('visible');
                });
            } else {
                labelEl.style.cursor = 'default';
            }

            // Ayarları Kaydetme
            const saveBtn = container.querySelector('#save-settings');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const w = parseInt(container.querySelector('#work-in').value) || 25;
                    const b = parseInt(container.querySelector('#break-in').value) || 5;

                    WORK_MINS = Math.max(1, Math.min(90, w)); // 1 ile 90 dk arası sınırla
                    BREAK_MINS = Math.max(1, Math.min(30, b)); // 1 ile 30 dk arası sınırla

                    time = (pomoPhase === 'work' ? WORK_MINS : BREAK_MINS) * 60;
                    overlayEl.classList.remove('visible');
                    mount();
                });
            }
        }

        mount();
    }

    App.register('timer', render);
    return { render, cleanup };
})();