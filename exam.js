/* ════════════════════════════════════════════
   ToStudy – Exam Planner Module (Time Enhanced)
   ════════════════════════════════════════════ */

const ExamModule = (() => {
    const STORAGE_KEY = 'tostudy_exams';
    let countdownInterval = null;

    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
    function save(exams) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
    }

    function cleanup() {
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    }

    // YENİ: Tarih ve Saati birleştirip Date objesi döndüren fonksiyon
    function parseDateTime(dateStr, timeStr = "09:00") {
        const dP = dateStr.split('.');
        const tP = timeStr.split(':');
        if (dP.length !== 3) return null;
        
        // Eğer saat girilmemişse varsayılan 09:00 kabul et
        const hour = tP[0] ? parseInt(tP[0]) : 9;
        const min = tP[1] ? parseInt(tP[1]) : 0;

        const d = new Date(parseInt(dP[2]), parseInt(dP[1]) - 1, parseInt(dP[0]), hour, min);
        return isNaN(d.getTime()) ? null : d;
    }

    function render(container) {
        cleanup();
        let exams = load();
        
        // YENİ: Listeyi tarih ve saate göre otomatik sırala
        exams.sort((a, b) => {
            return parseDateTime(a.date, a.time) - parseDateTime(b.date, b.time);
        });

        const modalBox = container.closest('.modal-box');
        if (modalBox) modalBox.classList.add('exam-theme');

        function buildHTML() {
            const now = Date.now();
            let nearest = null;
            
            exams.forEach(e => {
                const d = parseDateTime(e.date, e.time);
                if (d && d.getTime() > now) {
                    if (!nearest || d.getTime() < parseDateTime(nearest.date, nearest.time).getTime()) nearest = e;
                }
            });

            const svgRing = (id) => `
                <svg viewBox="0 0 100 100">
                    <circle class="bg-ring" cx="50" cy="50" r="40"></circle>
                    <circle class="progress-ring" id="${id}-ring" cx="50" cy="50" r="40"></circle>
                </svg>
            `;

            return `
        <svg width="0" height="0" style="position:absolute;">
            <defs>
                <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--accent)" />
                    <stop offset="100%" stop-color="#7c5cbf" />
                </linearGradient>
            </defs>
        </svg>

        <div class="module-title" style="color: var(--exam-accent); font-weight: 800;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:24px; height:24px;">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Sınav Planlayıcı
        </div>

        <div class="countdown-box" id="exam-countdown">
            ${nearest ? `
                <div class="countdown-exam-name">${escapeHtml(nearest.name)} (${nearest.time || '09:00'})</div>
                <div class="countdown-digits">
                    <div class="cd-unit">
                        <div class="cd-value">${svgRing('cd-days')}<div class="digit-number" id="cd-days-val">--</div></div>
                        <div class="cd-label">Gün</div>
                    </div>
                    <div class="cd-unit">
                        <div class="cd-value">${svgRing('cd-hrs')}<div class="digit-number" id="cd-hrs-val">--</div></div>
                        <div class="cd-label">Saat</div>
                    </div>
                    <div class="cd-unit">
                        <div class="cd-value">${svgRing('cd-mins')}<div class="digit-number" id="cd-mins-val">--</div></div>
                        <div class="cd-label">Dk</div>
                    </div>
                    <div class="cd-unit">
                        <div class="cd-value">${svgRing('cd-secs')}<div class="digit-number" id="cd-secs-val">--</div></div>
                        <div class="cd-label">Sn</div>
                    </div>
                </div>
            ` : `<p style="color:var(--text-secondary); opacity: 0.7;">Yaklaşan sınav bulunmuyor.</p>`}
        </div>

        <div class="input-row" style="margin-bottom: 25px;">
            <input class="neu-input exam-input" id="exam-name" type="text" placeholder="Sınav Adı" />
            <input class="neu-input exam-input" id="exam-date" type="text" placeholder="GG.AA.YYYY" style="max-width:115px;" />
            <input class="neu-input exam-input" id="exam-time" type="text" placeholder="SS:DD" style="max-width:75px;" />
            <button class="neu-btn primary" id="exam-add" style="background: var(--exam-accent); color: white; border: none;">${App.svgPlus()}</button>
        </div>

        <div id="exam-list">
            ${exams.map(e => examCardHTML(e)).join('')}
        </div>
    `;
        }

        function examCardHTML(e) {
            const total = e.subjects.length;
            const done = e.subjects.filter(s => s.done).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return `
        <div class="neu-card exam-card" data-exam="${e.id}" style="border-left: 6px solid var(--exam-accent); background: var(--exam-bg);">
            <div class="exam-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 1.1rem; color: #2d3748;">${escapeHtml(e.name)}</h3>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="exam-date" style="background: rgba(94, 129, 244, 0.1); color: var(--exam-accent); padding: 2px 8px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;">
                        ${escapeHtml(e.date)} - ${escapeHtml(e.time || '09:00')}
                    </span>
                    <button class="neu-btn-icon danger" data-del-exam="${e.id}" title="Sınavı Sil">${App.svgTrash()}</button>
                </div>
            </div>
            
            <div class="exam-prep-label" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Hazırlık: ${pct}%</div>
            <div class="neu-progress" style="height: 10px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden;">
                <div class="neu-progress-fill" style="width:${pct}%; background: var(--exam-accent); height: 100%; border-radius: 10px;"></div>
            </div>

            <div class="exam-subjects" style="margin-top: 15px;">
                ${e.subjects.map(s => `
                    <div class="exam-subject-row" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <div class="neu-checkbox ${s.done ? 'checked' : ''}" data-exam-id="${e.id}" data-subj-id="${s.id}">
                            ${App.svgCheck()}
                        </div>
                        <span class="subject-text ${s.done ? 'done' : ''}" style="flex-grow: 1; font-size: 0.9rem;">${escapeHtml(s.name)}</span>
                        <button class="neu-btn-icon" data-del-subj="${s.id}" data-parent="${e.id}">✕</button>
                    </div>
                `).join('')}
            </div>

            <div class="input-row mt-8" style="margin-top: 12px; gap: 8px;">
                <input class="neu-input exam-input" placeholder="Konu ekle..." data-subj-input="${e.id}" />
                <button class="neu-btn sm" data-add-subj="${e.id}">${App.svgPlus()}</button>
            </div>
        </div>
    `;
        }

        function mount() {
            container.innerHTML = buildHTML();
            attachEvents();
            startCountdown();
        }

        function attachEvents() {
            const addBtn = container.querySelector('#exam-add');
            const nameIn = container.querySelector('#exam-name');
            const dateIn = container.querySelector('#exam-date');
            const timeIn = container.querySelector('#exam-time'); // Yeni input yakalandı

            if (addBtn) {
                const doAdd = () => {
                    const name = nameIn.value.trim();
                    const date = dateIn.value.trim();
                    const time = timeIn.value.trim() || "09:00"; // Saat boşsa varsayılan
                    if (!name || !date) return;
                    exams.push({ id: App.uid(), name, date, time, subjects: [] });
                    save(exams);
                    mount();
                };
                addBtn.addEventListener('click', doAdd);
            }

            // Diğer event listener'lar (delete, toggle vs.) aynı kalacak
            container.querySelectorAll('[data-del-exam]').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    exams = exams.filter(x => x.id !== btn.dataset.delExam);
                    save(exams);
                    mount();
                });
            });

            container.querySelectorAll('.neu-checkbox[data-exam-id]').forEach(cb => {
                cb.addEventListener('click', () => {
                    const exam = exams.find(x => x.id === cb.dataset.examId);
                    if (!exam) return;
                    const subj = exam.subjects.find(s => s.id === cb.dataset.subjId);
                    if (subj) { subj.done = !subj.done; save(exams); mount(); }
                });
            });

            container.querySelectorAll('[data-del-subj]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const exam = exams.find(x => x.id === btn.dataset.parent);
                    if (!exam) return;
                    exam.subjects = exam.subjects.filter(s => s.id !== btn.dataset.delSubj);
                    save(exams);
                    mount();
                });
            });

            container.querySelectorAll('[data-add-subj]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = container.querySelector(`[data-subj-input="${btn.dataset.addSubj}"]`);
                    const name = input?.value.trim();
                    if (!name) return;
                    const exam = exams.find(x => x.id === btn.dataset.addSubj);
                    if (exam) {
                        exam.subjects.push({ id: App.uid(), name, done: false });
                        save(exams);
                        mount();
                    }
                });
            });
        }

        function startCountdown() {
            const now = Date.now();
            let nearest = null;
            exams.forEach(e => {
                const d = parseDateTime(e.date, e.time); // Güncellendi
                if (d && d.getTime() > now) {
                    if (!nearest || d.getTime() < parseDateTime(nearest.date, nearest.time).getTime()) nearest = e;
                }
            });
            if (!nearest) return;

            const target = parseDateTime(nearest.date, nearest.time).getTime(); // Güncellendi
            
            function setRing(id, percent) {
                const ring = document.getElementById(id);
                if (!ring) return;
                const p = Math.max(0, Math.min(100, percent));
                ring.style.strokeDashoffset = 251.2 - (251.2 * p / 100);
            }

            function tick() {
                const diff = target - Date.now();
                if (diff <= 0) {
                    cleanup();
                    if (document.getElementById('cd-days-val')) document.getElementById('cd-days-val').textContent = '0';
                    return;
                }
                
                const days = Math.floor(diff / 86400000);
                const hrs = Math.floor((diff % 86400000) / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                
                if (document.getElementById('cd-days-val')) document.getElementById('cd-days-val').textContent = days;
                if (document.getElementById('cd-hrs-val')) document.getElementById('cd-hrs-val').textContent = String(hrs).padStart(2, '0');
                if (document.getElementById('cd-mins-val')) document.getElementById('cd-mins-val').textContent = String(mins).padStart(2, '0');
                if (document.getElementById('cd-secs-val')) document.getElementById('cd-secs-val').textContent = String(secs).padStart(2, '0');

                setRing('cd-days-ring', (days / 30) * 100);
                setRing('cd-hrs-ring', (hrs / 24) * 100);
                setRing('cd-mins-ring', (mins / 60) * 100);
                setRing('cd-secs-ring', (secs / 60) * 100);
            }
            
            tick();
            countdownInterval = setInterval(tick, 1000);
        }

        mount();
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    App.register('exam', render);
    return { render, cleanup };
})();
