/* ════════════════════════════════════════════
   ToStudy – AGNO Hesaplayıcı Module
   ════════════════════════════════════════════ */

const AgnoModule = (() => {
    const STORAGE_KEY = 'tostudy_agno';

    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
    function save(courses) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    }

    // Turkish grading scale (4.0)
    function letterGrade(avg) {
        if (avg >= 90) return { letter: 'AA', gpa: 4.0 };
        if (avg >= 85) return { letter: 'BA', gpa: 3.5 };
        if (avg >= 80) return { letter: 'BB', gpa: 3.0 };
        if (avg >= 75) return { letter: 'CB', gpa: 2.5 };
        if (avg >= 70) return { letter: 'CC', gpa: 2.0 };
        if (avg >= 65) return { letter: 'DC', gpa: 1.5 };
        if (avg >= 60) return { letter: 'DD', gpa: 1.0 };
        if (avg >= 50) return { letter: 'FD', gpa: 0.5 };
        return { letter: 'FF', gpa: 0.0 };
    }

    function calcWeightedAvg(course) {
        const vize = parseFloat(course.vize) || 0;
        const odev = parseFloat(course.odev) || 0;
        const final_ = parseFloat(course.final) || 0;
        const vizePct = parseFloat(course.vizePct) || 40;
        const odevPct = parseFloat(course.odevPct) || 0;
        const finalPct = parseFloat(course.finalPct) || 60;
        return (vize * vizePct + odev * odevPct + final_ * finalPct) / 100;
    }

    function calcAGNO(courses) {
        let totalAkts = 0;
        let totalWeighted = 0;
        courses.forEach(c => {
            const akts = parseFloat(c.akts) || 0;
            const avg = calcWeightedAvg(c);
            const { gpa } = letterGrade(avg);
            totalAkts += akts;
            totalWeighted += akts * gpa;
        });
        return totalAkts > 0 ? (totalWeighted / totalAkts) : 0;
    }

    function render(container) {
        let courses = load();

        function mount() {
            const agno = calcAGNO(courses);
            container.innerHTML = `
                <div class="module-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
                        <line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
                    </svg>
                    AGNO Hesaplayıcı
                </div>

                <div class="agno-result-box">
                    <div class="agno-value">${agno.toFixed(2)}</div>
                    <div class="agno-label">Genel Ağırlıklı Not Ortalaması</div>
                </div>

                <div class="agno-headers">
                    <span>Ders Adı</span>
                    <span>AKTS</span>
                    <span>Vize (%)</span>
                    <span>Ödev (%)</span>
                    <span>Final (%)</span>
                </div>

                <div id="agno-courses">
                    ${courses.map(c => courseRowHTML(c)).join('')}
                </div>

                <div style="display:flex;gap:10px;margin-top:14px;">
                    <button class="neu-btn primary" id="agno-add">${App.svgPlus()} Ders Ekle</button>
                </div>

                <!-- Grade detail table -->
                <div id="agno-details" style="margin-top:20px;">
                    ${courses.length > 0 ? detailTableHTML(courses) : ''}
                </div>
            `;
            attachEvents();
        }

       function courseRowHTML(c) {
            return `
                <div class="agno-course-row" data-course="${c.id}">
                    <input class="neu-input" data-field="name" value="${escapeAttr(c.name)}" placeholder="Ders adı" />
                    
                    <div class="custom-number-wrap">
                        <input class="neu-input hide-spinner" data-field="akts" value="${escapeAttr(c.akts)}" placeholder="AKTS" type="number" min="0" />
                        <div class="custom-arrows">
                            <span class="arrow-up" onclick="this.parentNode.previousElementSibling.stepUp(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▲</span>
                            <span class="arrow-down" onclick="this.parentNode.previousElementSibling.stepDown(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▼</span>
                        </div>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:4px;">
                        <div class="custom-number-wrap">
                            <input class="neu-input hide-spinner" data-field="vize" value="${escapeAttr(c.vize)}" placeholder="Not" type="number" min="0" max="100" />
                            <div class="custom-arrows">
                                <span class="arrow-up" onclick="this.parentNode.previousElementSibling.stepUp(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▲</span>
                                <span class="arrow-down" onclick="this.parentNode.previousElementSibling.stepDown(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▼</span>
                            </div>
                        </div>
                        <div class="custom-number-wrap">
                            <input class="neu-input hide-spinner" data-field="vizePct" value="${escapeAttr(c.vizePct)}" placeholder="%" type="number" min="0" max="100" style="font-size:0.72rem;padding:6px 8px;" />
                            <div class="custom-arrows sm">
                                <span class="arrow-up" onclick="this.parentNode.previousElementSibling.stepUp(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▲</span>
                                <span class="arrow-down" onclick="this.parentNode.previousElementSibling.stepDown(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▼</span>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:4px;">
                        <div class="custom-number-wrap">
                            <input class="neu-input hide-spinner" data-field="odev" value="${escapeAttr(c.odev)}" placeholder="Not" type="number" min="0" max="100" />
                            <div class="custom-arrows">
                                <span class="arrow-up" onclick="this.parentNode.previousElementSibling.stepUp(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▲</span>
                                <span class="arrow-down" onclick="this.parentNode.previousElementSibling.stepDown(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▼</span>
                            </div>
                        </div>
                        <div class="custom-number-wrap">
                            <input class="neu-input hide-spinner" data-field="odevPct" value="${escapeAttr(c.odevPct)}" placeholder="%" type="number" min="0" max="100" style="font-size:0.72rem;padding:6px 8px;" />
                            <div class="custom-arrows sm">
                                <span class="arrow-up" onclick="this.parentNode.previousElementSibling.stepUp(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▲</span>
                                <span class="arrow-down" onclick="this.parentNode.previousElementSibling.stepDown(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▼</span>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:4px;">
                        <div class="custom-number-wrap">
                            <input class="neu-input hide-spinner" data-field="final" value="${escapeAttr(c.final)}" placeholder="Not" type="number" min="0" max="100" />
                            <div class="custom-arrows">
                                <span class="arrow-up" onclick="this.parentNode.previousElementSibling.stepUp(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▲</span>
                                <span class="arrow-down" onclick="this.parentNode.previousElementSibling.stepDown(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▼</span>
                            </div>
                        </div>
                        <div class="custom-number-wrap">
                            <input class="neu-input hide-spinner" data-field="finalPct" value="${escapeAttr(c.finalPct)}" placeholder="%" type="number" min="0" max="100" style="font-size:0.72rem;padding:6px 8px;" />
                            <div class="custom-arrows sm">
                                <span class="arrow-up" onclick="this.parentNode.previousElementSibling.stepUp(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▲</span>
                                <span class="arrow-down" onclick="this.parentNode.previousElementSibling.stepDown(); this.parentNode.previousElementSibling.dispatchEvent(new Event('input'))">▼</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        function detailTableHTML(courses) {
            let rows = courses.map(c => {
                const avg = calcWeightedAvg(c);
                const { letter, gpa } = letterGrade(avg);
                return `
                    <div class="neu-card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;">
                        <span style="font-weight:600;flex:2;">${escapeHtml(c.name || '–')}</span>
                        <span style="flex:0.5;text-align:center;color:var(--text-light);">${c.akts || '–'}</span>
                        <span style="flex:1;text-align:center;font-weight:700;">${avg.toFixed(1)}</span>
                        <span style="flex:0.7;text-align:center;font-weight:700;color:var(--accent);">${letter}</span>
                        <span style="flex:0.5;text-align:center;">${gpa.toFixed(1)}</span>
                        <button class="neu-btn-icon danger" data-del-course="${c.id}" title="Dersi Sil">${App.svgTrash()}</button>
                    </div>
                `;
            }).join('');
            return `
                <div style="display:flex;justify-content:space-between;padding:0 16px;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-light);margin-bottom:6px;">
                    <span style="flex:2;">Ders</span>
                    <span style="flex:0.5;text-align:center;">AKTS</span>
                    <span style="flex:1;text-align:center;">Ortalama</span>
                    <span style="flex:0.7;text-align:center;">Harf</span>
                    <span style="flex:0.5;text-align:center;">Katsayı</span>
                    <span style="width:26px;"></span>
                </div>
                ${rows}
            `;
        }

        function attachEvents() {
            // Add course
            container.querySelector('#agno-add').addEventListener('click', () => {
                courses.push({ id: App.uid(), name: '', akts: '', vize: '', vizePct: '40', odev: '', odevPct: '0', final: '', finalPct: '60' });
                save(courses);
                mount();
            });

            // Input changes
            container.querySelectorAll('.agno-course-row input').forEach(inp => {
                inp.addEventListener('input', () => {
                    const row = inp.closest('.agno-course-row');
                    const c = courses.find(x => x.id === row.dataset.course);
                    if (c) {
                        c[inp.dataset.field] = inp.value;
                        save(courses);
                        // Update result and details without full remount
                        const agno = calcAGNO(courses);
                        const valEl = container.querySelector('.agno-value');
                        if (valEl) valEl.textContent = agno.toFixed(2);
                        const detEl = container.querySelector('#agno-details');
                        if (detEl && courses.length > 0) detEl.innerHTML = detailTableHTML(courses);
                    }
                });
            });

            // Delete course
            container.querySelectorAll('[data-del-course]').forEach(btn => {
                btn.addEventListener('click', () => {
                    courses = courses.filter(x => x.id !== btn.dataset.delCourse);
                    save(courses);
                    mount();
                });
            });
        }

        mount();
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }
    function escapeAttr(s) {
        return String(s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    App.register('agno', render);
    return { render };
})();
