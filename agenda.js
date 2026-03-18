/* ════════════════════════════════════════════
   ToStudy – Dijital Ajanda Module (IndexedDB)
   ════════════════════════════════════════════ */

const AgendaModule = (() => {
    const DB_NAME = 'ToStudyAgendaDB';
    const STORE_NAME = 'agenda_store';
    const DB_VERSION = 1;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function load() {
        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get('folders');
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch { return []; }
    }

    async function save(folders) {
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.put(folders, 'folders');
        } catch (e) { console.error("Kayıt Hatası:", e); }
    }

    const customPrompt = (title, defaultValue = "") => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'custom-prompt-overlay';
            // customPrompt içindeki HTML kısmını bu şekilde değiştir:
            overlay.innerHTML = `
    <div class="custom-prompt-box">
        <div class="custom-prompt-title">${title}</div>
        <input type="text" id="p-input" class="neu-input custom-prompt-input" value="${defaultValue}" spellcheck="false">
        <div class="custom-prompt-actions">
            <button class="soft-btn" id="p-cancel">İptal</button>
            <button class="soft-btn" id="p-confirm" style="color: var(--accent-color); font-weight: bold;">Tamam</button>
        </div>
    </div>
`;
            document.body.appendChild(overlay);
            const input = overlay.querySelector('#p-input');
            setTimeout(() => { overlay.classList.add('active'); input.focus(); input.select(); }, 10);

            const close = (val) => {
                overlay.classList.remove('active');
                setTimeout(() => { overlay.remove(); resolve(val); }, 300);
            };

            overlay.querySelector('#p-confirm').onclick = () => close(input.value.trim());
            overlay.querySelector('#p-cancel').onclick = () => close(null);
            input.onkeydown = (e) => {
                if (e.key === 'Enter') close(input.value.trim());
                if (e.key === 'Escape') close(null);
            };
        });
    };

    async function render(container) {
        let folders = await load();

        function mount() {
            container.innerHTML = `
                <div class="module-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    Dijital Ajanda
                </div>

                <div class="input-row">
                    <input class="neu-input" id="agenda-folder-name" type="text" placeholder="Yeni ders klasörü..." />
                    <button class="neu-btn primary" id="agenda-add-folder">${App.svgPlus()}</button>
                </div>

                <div id="agenda-folders">
                    ${folders.map(f => folderHTML(f)).join('')}
                </div>
            `;
            attachEvents();
        }

        function folderHTML(f) {
            const fileCount = f.files.length;
            return `
                <div class="neu-card agenda-folder" data-folder="${f.id}">
                    <div class="agenda-folder-header">
                        <h3>${App.svgFolder()} ${escapeHtml(f.name)}</h3>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span class="file-count">Contains ${fileCount} File(s)</span>
                            <button class="neu-btn-icon danger" data-del-folder="${f.id}" title="Klasörü Sil">${App.svgTrash()}</button>
                        </div>
                    </div>
                    <div class="agenda-folder-content">
                        <div class="agenda-file-list">
                            ${f.files.map(file => fileItemHTML(f.id, file)).join('')}
                            ${f.files.length === 0 ? '<p style="text-align:center;color:var(--text-light);font-size:0.82rem;padding:8px 0;">Henüz dosya yok.</p>' : ''}
                        </div>
                        
                        <div class="agenda-actions-container" style="justify-content: center;">
                            <button class="agenda-btn" data-upload="${f.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                <span>Dosya Yükle</span>
                            </button>
                            <input type="file" data-file-input="${f.id}" accept=".mp3,.jpg,.jpeg,.png,.pdf" style="display:none;" />
                        </div>
                    </div>
                </div>
            `;
        }

        function fileItemHTML(folderId, file) {
            const icon = App.svgFile();
            const typeLabel = file.name.split('.').pop().toUpperCase();
            return `
                <div class="agenda-file-item">
                    ${icon}
                    <span class="file-name" style="cursor: pointer;" data-view-file="${file.id}" data-parent="${folderId}">${escapeHtml(file.name)}</span>
                    <span style="font-size:0.7rem;color:var(--text-light);text-transform:uppercase;">${typeLabel}</span>
                    
                    <div style="display: flex; gap: 5px;">
                        <button class="neu-btn-icon" data-rename-file="${file.id}" data-parent="${folderId}" title="Adı Düzenle">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>

                        <button class="neu-btn-icon" data-view-file="${file.id}" data-parent="${folderId}" title="Görüntüle">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        
                        <button class="neu-btn-icon" data-download="${file.id}" data-parent="${folderId}" title="İndir">${App.svgDownload()}</button>
                        <button class="neu-btn-icon danger" data-del-file="${file.id}" data-parent="${folderId}" title="Sil">${App.svgTrash()}</button>
                    </div>
                </div>
            `;
        }

        function attachEvents() {
            // Klasör Ekleme
            const addBtn = container.querySelector('#agenda-add-folder');
            const nameIn = container.querySelector('#agenda-folder-name');
            const doAdd = async () => {
                const name = nameIn.value.trim();
                if (!name) return;
                folders.push({ id: App.uid(), name, files: [] });
                await save(folders);
                mount();
            };
            addBtn.onclick = doAdd;
            nameIn.onkeydown = (e) => { if (e.key === 'Enter') doAdd(); };

            // Klasör Aç/Kapat
            container.querySelectorAll('.agenda-folder-header').forEach(h => {
                h.onclick = (e) => {
                    if (e.target.closest('[data-del-folder]')) return;
                    h.closest('.agenda-folder').classList.toggle('open');
                };
            });

            // Klasör Sil
            container.querySelectorAll('[data-del-folder]').forEach(btn => {
                btn.onclick = async () => {
                    folders = folders.filter(f => f.id !== btn.dataset.delFolder);
                    await save(folders);
                    mount();
                };
            });

            // Dosya Seçme
            container.querySelectorAll('[data-upload]').forEach(btn => {
                btn.onclick = () => container.querySelector(`[data-file-input="${btn.dataset.upload}"]`).click();
            });

            container.querySelectorAll('[data-file-input]').forEach(input => {
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const folderId = input.dataset.fileInput;
                    const folder = folders.find(f => f.id === folderId);

                    const reader = new FileReader();
                    reader.onload = async () => {
                        folder.files.push({ id: App.uid(), name: file.name, type: 'file', data: reader.result });
                        await save(folders);
                        mount();
                        setTimeout(() => container.querySelector(`[data-folder="${folderId}"]`)?.classList.add('open'), 100);
                    };
                    reader.readAsDataURL(file);
                };
            });

            // YENİ: Dosya Adı Düzenleme (DÜZELTİLDİ)
            container.querySelectorAll('[data-rename-file]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Tıklamanın klasörü kapatmasını engelle

                    const folder = folders.find(f => f.id === btn.dataset.parent);
                    if (!folder) return;

                    const file = folder.files.find(f => f.id === btn.dataset.renameFile);
                    if (!file) return;

                    // customPrompt artık içerde tanımlı
                    const newName = await customPrompt('Dosya ismini düzenle:', file.name);

                    if (newName && newName.trim() !== "") {
                        file.name = newName.trim();
                        await save(folders);
                        mount();
                        setTimeout(() => container.querySelector(`[data-folder="${btn.dataset.parent}"]`)?.classList.add('open'), 100);
                    }
                });
            });

            // Görüntüleme
            container.querySelectorAll('[data-view-file]').forEach(btn => {
                btn.onclick = () => {
                    const folder = folders.find(f => f.id === btn.dataset.parent);
                    const file = folder.files.find(f => f.id === btn.dataset.viewFile);
                    openMediaViewer(file);
                };
            });

            // İndirme
            container.querySelectorAll('[data-download]').forEach(btn => {
                btn.onclick = () => {
                    const folder = folders.find(f => f.id === btn.dataset.parent);
                    const file = folder.files.find(f => f.id === btn.dataset.download);
                    const a = document.createElement('a');
                    a.href = file.data; a.download = file.name; a.click();
                };
            });

            // Dosya Silme
            container.querySelectorAll('[data-del-file]').forEach(btn => {
                btn.onclick = async () => {
                    const folder = folders.find(f => f.id === btn.dataset.parent);
                    folder.files = folder.files.filter(f => f.id !== btn.dataset.delFile);
                    await save(folders);
                    mount();
                    setTimeout(() => container.querySelector(`[data-folder="${btn.dataset.parent}"]`)?.classList.add('open'), 100);
                };
            });
        }

        mount();
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // Media Viewer (Önceki mesajdaki ile aynı, hız kontrolleri dahil)
    function openMediaViewer(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        let contentHtml = '';

        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
            contentHtml = `<img src="${file.data}" style="max-width:90vw; max-height:85vh; border-radius:15px; box-shadow: 0 15px 40px rgba(0,0,0,0.6);" />`;
        } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
            contentHtml = `
                <div style="padding: 30px; background: var(--bg-color); border-radius: 20px; text-align: center; box-shadow: 10px 10px 30px rgba(0,0,0,0.5); width: 350px;">
                    <h3 style="margin-bottom: 20px; color: var(--text-primary); font-size: 1.1rem;">${escapeHtml(file.name)}</h3>
                    <audio id="media-audio" controls src="${file.data}" style="width: 100%; outline: none; margin-bottom: 20px;"></audio>
                    <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px;">
                        <button class="neu-btn sm" onclick="document.getElementById('media-audio').playbackRate = 1" style="flex:1;">1x</button>
                        <button class="neu-btn sm" onclick="document.getElementById('media-audio').playbackRate = 2" style="flex:1;">2x</button>
                        <button class="neu-btn sm" onclick="document.getElementById('media-audio').playbackRate = 3" style="flex:1;">3x</button>
                    </div>
                </div>`;
        } else if (ext === 'pdf') {
            contentHtml = `<iframe src="${file.data}" style="width: 85vw; height: 85vh; border: none; border-radius: 15px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></iframe>`;
        } else {
            contentHtml = `<div style="padding: 30px; background: var(--bg-color); border-radius: 15px; text-align:center;">Önizleme yok.</div>`;
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.75); z-index: 99999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(8px); opacity: 0; transition: opacity 0.3s ease;';
        overlay.onclick = (e) => { if (e.target === overlay) { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 300); } };

        const wrap = document.createElement('div'); wrap.innerHTML = contentHtml;
        overlay.appendChild(wrap);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.style.opacity = '1');
    }

    App.register('agenda', render);
    return { render };
})();

