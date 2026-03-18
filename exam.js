/* ════════════════════════════════════════════
   ToStudy – Exam Planner Module
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

    function parseDate(str) {
        // accepts GG.AA.YYYY
        const p = str.split('.');
        if (p.length !== 3) return null;
        const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
        return isNaN(d.getTime()) ? null : d;
    }

    function render(container) {
        cleanup();
        let exams = load();
        const modalBox = container.closest('.modal-box');
        if (modalBox) modalBox.classList.add('exam-theme');

        function buildHTML() {
            // En yakın sınavı bul
            const now = Date.now();
            let nearest = null;
            exams.forEach(e => {
                const d = parseDate(e.date);
                if (d && d.getTime() > now) {
                    if (!nearest || d.getTime() < parseDate(nearest.date).getTime()) nearest = e;
                }
            });

            // Dinamik SVG Çember Şablonu
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
                <div class="countdown-exam-name">${escapeHtml(nearest.name)}</div>
                <div class="countdown-digits">
                    <div class="cd-unit">
                        <div class="cd-value">
                            ${svgRing('cd-days')}
                            <div class="digit-number" id="cd-days-val">--</div>
                        </div>
                        <div class="cd-label">Gün</div>
                    </div>
                    <div class="cd-unit">
                        <div class="cd-value">
                            ${svgRing('cd-hrs')}
                            <div class="digit-number" id="cd-hrs-val">--</div>
                        </div>
                        <div class="cd-label">Saat</div>
                    </div>
                    <div class="cd-unit">
                        <div class="cd-value">
                            ${svgRing('cd-mins')}
                            <div class="digit-number" id="cd-mins-val">--</div>
                        </div>
                        <div class="cd-label">Dk</div>
                    </div>
                    <div class="cd-unit">
                        <div class="cd-value">
                            ${svgRing('cd-secs')}
                            <div class="digit-number" id="cd-secs-val">--</div>
                        </div>
                        <div class="cd-label">Sn</div>
                    </div>
                </div>
            ` : `<p style="color:var(--text-secondary); opacity: 0.7;">Yaklaşan sınav bulunmuyor.</p>`}
        </div>

        <div class="input-row" style="margin-bottom: 25px;">
            <input class="neu-input exam-input" id="exam-name" type="text" placeholder="Sınav Adı" />
            <input class="neu-input exam-input" id="exam-date" type="text" placeholder="GG.AA.YYYY" style="max-width:130px;" />
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
                    <span class="exam-date" style="background: rgba(94, 129, 244, 0.1); color: var(--exam-accent); padding: 2px 8px; border-radius: 8px; font-size: 0.85rem; font-weight: 600;">${escapeHtml(e.date)}</span>
                    <button class="neu-btn-icon danger" data-del-exam="${e.id}" title="Sınavı Sil" style="color: var(--danger);">${App.svgTrash()}</button>
                </div>
            </div>

            <div class="exam-prep-label" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Hazırlık: ${pct}%</div>
            <div class="neu-progress" style="height: 10px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.05);">
                <div class="neu-progress-fill" style="width:${pct}%; background: var(--exam-accent); height: 100%; border-radius: 10px; transition: width 0.4s ease;"></div>
            </div>

            <div class="exam-subjects" style="margin-top: 15px;">
                ${e.subjects.map(s => `
                    <div class="exam-subject-row" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 5px; border-radius: 8px; transition: background 0.2s;">
                        <div class="neu-checkbox ${s.done ? 'checked' : ''}" data-exam-id="${e.id}" data-subj-id="${s.id}" style="cursor: pointer; color: ${s.done ? 'var(--exam-accent)' : 'var(--text-secondary)'};">
                            ${App.svgCheck()}
                        </div>
                        <span class="subject-text ${s.done ? 'done' : ''}" style="flex-grow: 1; font-size: 0.9rem; ${s.done ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(s.name)}</span>
                        <button class="neu-btn-icon" data-del-subj="${s.id}" data-parent="${e.id}" title="Konuyu Sil" style="opacity: 0.5; font-size: 0.8rem;">✕</button>
                    </div>
                `).join('')}
            </div>

            <div class="input-row mt-8" style="margin-top: 12px; gap: 8px;">
                <input class="neu-input exam-input" placeholder="Konu ekle..." data-subj-input="${e.id}" style="padding: 8px 12px; font-size: 0.85rem;" />
                <button class="neu-btn sm" data-add-subj="${e.id}" style="width: 36px; height: 36px; padding: 0; background: var(--exam-bg); color: var(--exam-accent);">${App.svgPlus()}</button>
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
            if (addBtn) {
                const doAdd = () => {
                    const name = nameIn.value.trim();
                    const date = dateIn.value.trim();
                    if (!name || !date) return;
                    exams.push({ id: App.uid(), name, date, subjects: [] });
                    save(exams);
                    mount();
                };
                addBtn.addEventListener('click', doAdd);
                nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
                dateIn.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
            }

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
            container.querySelectorAll('[data-subj-input]').forEach(input => {
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        const btn = container.querySelector(`[data-add-subj="${input.dataset.subjInput}"]`);
                        btn?.click();
                    }
                });
            });
        }

        function startCountdown() {
            const now = Date.now();
            let nearest = null;
            exams.forEach(e => {
                const d = parseDate(e.date);
                if (d && d.getTime() > now) {
                    if (!nearest || d.getTime() < parseDate(nearest.date).getTime()) nearest = e;
                }
            });
            if (!nearest) return;

            const target = parseDate(nearest.date).getTime();
            
            // Çemberleri güncelleyen yardımcı fonksiyon
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
                    const dEl = document.getElementById('cd-days-val');
                    if (dEl) dEl.textContent = '0';
                    setRing('cd-days-ring', 0); setRing('cd-hrs-ring', 0); setRing('cd-mins-ring', 0); setRing('cd-secs-ring', 0);
                    return;
                }
                
                const days = Math.floor(diff / 86400000);
                const hrs = Math.floor((diff % 86400000) / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                
                // Rakamları güncelle
                const dEl = document.getElementById('cd-days-val');
                const hEl = document.getElementById('cd-hrs-val');
                const mEl = document.getElementById('cd-mins-val');
                const sEl = document.getElementById('cd-secs-val');
                
                if (dEl) dEl.textContent = days;
                if (hEl) hEl.textContent = String(hrs).padStart(2, '0');
                if (mEl) mEl.textContent = String(mins).padStart(2, '0');
                if (sEl) sEl.textContent = String(secs).padStart(2, '0');

                // Halkaları güncelle
                setRing('cd-days-ring', (days / 30) * 100); // 30 gün üzerinden yüzdelik (Görsellik için)
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