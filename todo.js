/* ════════════════════════════════════════════
   ToStudy – ToDo Module
   ════════════════════════════════════════════ */

const TodoModule = (() => {
    const STORAGE_KEY = 'tostudy_todos';

    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
        catch { return []; }
    }
    function save(todos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    function render(container) {
        let filter = 'all'; // all | active | done
        let todos = load();

        const html = `
            <div class="module-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Yapılacaklar
            </div>

            <!-- Filter Bar -->
            <div class="filter-bar">
                <button class="neu-btn sm active" data-filter="all">Hepsi</button>
                <button class="neu-btn sm" data-filter="active">Yapılacaklar</button>
                <button class="neu-btn sm" data-filter="done">Tamamlananlar</button>
            </div>

            <!-- Input Row -->
            <div class="input-row">
                <input class="neu-input" id="todo-text" type="text" placeholder="Görev ekle..." />
                <input class="neu-input" id="todo-date" type="text" placeholder="GG.AA.YYYY" style="max-width:130px;" />
                <button class="neu-btn primary" id="todo-add" title="Ekle">${App.svgPlus()}</button>
            </div>

            <div id="todo-list"></div>
        `;
        container.innerHTML = html;

        const listEl = container.querySelector('#todo-list');
        const textIn = container.querySelector('#todo-text');
        const dateIn = container.querySelector('#todo-date');
        const addBtn = container.querySelector('#todo-add');

        // ── Filter buttons ──
        container.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                filter = btn.dataset.filter;
                container.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderList();
            });
        });

        // ── Add ──
        function addTodo() {
            const text = textIn.value.trim();
            if (!text) return;
            todos.push({ id: App.uid(), text, date: dateIn.value.trim(), done: false });
            save(todos);
            textIn.value = '';
            dateIn.value = '';
            textIn.focus();
            renderList();
        }
        addBtn.addEventListener('click', addTodo);
        textIn.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
        dateIn.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

        // ── Render list ──
        function renderList() {
            const visible = todos.filter(t => {
                if (filter === 'active') return !t.done;
                if (filter === 'done') return t.done;
                return true;
            });

            if (visible.length === 0) {
                listEl.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px;font-size:0.9rem;">Henüz görev yok.</p>';
                return;
            }

            listEl.innerHTML = visible.map(t => `
                <div class="neu-card" style="display:flex;align-items:center;gap:12px;${t.done ? 'opacity:0.55;' : ''}">
                    <div class="neu-checkbox ${t.done ? 'checked' : ''}" data-id="${t.id}">
                        ${App.svgCheck()}
                    </div>
                    <div style="flex:1;${t.done ? 'text-decoration:line-through;' : ''}">
                        <div style="font-weight:600;font-size:0.92rem;">${escapeHtml(t.text)}</div>
                        ${t.date ? `<div style="font-size:0.75rem;color:var(--text-light);margin-top:2px;">${escapeHtml(t.date)}</div>` : ''}
                    </div>
                    <button class="neu-btn-icon danger" data-del="${t.id}" title="Sil">${App.svgTrash()}</button>
                </div>
            `).join('');

            // checkbox
            listEl.querySelectorAll('.neu-checkbox').forEach(cb => {
                cb.addEventListener('click', () => {
                    const t = todos.find(x => x.id === cb.dataset.id);
                    if (t) { t.done = !t.done; save(todos); renderList(); }
                });
            });

            // delete
            listEl.querySelectorAll('[data-del]').forEach(btn => {
                btn.addEventListener('click', () => {
                    todos = todos.filter(x => x.id !== btn.dataset.del);
                    save(todos);
                    renderList();
                });
            });
        }

        renderList();
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    App.register('todo', render);
    return { render };
})();
