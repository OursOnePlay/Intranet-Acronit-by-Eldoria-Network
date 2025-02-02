document.addEventListener("DOMContentLoaded", function () {
    const linksContainer = document.getElementById('linksContainer');
    const greetingContainer = document.getElementById('greeting');
    const themeToggle = document.getElementById('themeToggle');
    const searchInput = document.getElementById('searchInput');
    const modalOverlay = document.getElementById('modalOverlay');
    const alertOverlay = document.getElementById('alertOverlay');
    const searchButton = document.getElementById('searchButton');
    const searchButton2 = document.getElementById('searchButton2');
    
    const buttons = {
        add: document.getElementById('addLinkButton'),
        delete: document.getElementById('deleteButton'),
        save: document.getElementById('saveButton'),
        import: document.getElementById('importButton'),
        modify: document.getElementById('modifyButton'),
        profile: document.getElementById('changeNameButton')
    };

    // Mot de passe a changer
    const PASSWORD_HASH = "01f98842bcee8ae949a1848fb5a1763d";
    let links = JSON.parse(localStorage.getItem('links')) || [];
    let deleteMode = false;

    const controls = document.querySelectorAll('.control');
    const secretThemes = {
        galaxy: ['red', 'red', 'green', 'yellow'],
        girly: ['green', 'green', 'green', 'red', 'yellow', 'green'],
        subway: ['red', 'yellow', 'yellow', 'yellow', 'green']
    };
    let inputSequence = [];

    function activateSpecialTheme(themeName) {
        document.body.dataset.theme = themeName;
        localStorage.setItem('theme', themeName);
        
        const existingVideo = document.getElementById('subwayVideo');
        if (existingVideo) existingVideo.remove();

        if (themeName === 'subway') {
            const video = document.createElement('iframe');
            video.setAttribute('src', 'https://www.youtube.com/embed/L_fcrOyoWZ8?autoplay=1&mute=1&controls=0');
            video.style.position = 'fixed';
            video.style.bottom = '20px';
            video.style.right = '20px';
            video.style.width = '300px';
            video.style.height = '170px';
            video.style.border = 'none';
            video.style.borderRadius = '10px';
            video.style.boxShadow = '0 0 20px rgba(255,165,0,0.5)';
            video.id = 'subwayVideo';
            document.body.appendChild(video);
        }
    }

    controls.forEach(control => {
        control.addEventListener('click', (e) => {
            const color = Array.from(control.classList).find(c => c !== 'control');
            inputSequence.push(color);
            
            if (inputSequence.length > 10) inputSequence.shift();
            
            for(const [theme, sequence] of Object.entries(secretThemes)) {
                if(inputSequence.slice(-sequence.length).join() === sequence.join()) {
                    activateSpecialTheme(theme);
                    inputSequence = [];
                    return;
                }
            }
        });
    });

    function toggleTheme() {
        const currentTheme = document.body.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.dataset.theme = newTheme;
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', newTheme);
        
        const video = document.getElementById('subwayVideo');
        if (video) video.remove();
    }

    async function showModal(title, fields) {
        return new Promise(resolve => {
            modalOverlay.style.display = 'flex';
            document.getElementById('modalTitle').textContent = title;
            const body = modalOverlay.querySelector('.modal-body');
            body.innerHTML = fields.map(field => `
                <input type="${field.type || 'text'}" 
                       class="modal-input" 
                       placeholder="${field.placeholder}" 
                       value="${field.value || ''}"
                       ${field.autofocus ? 'autofocus' : ''}>
            `).join('');

            const confirm = () => {
                const values = Array.from(body.querySelectorAll('input')).map(i => i.value);
                modalOverlay.style.display = 'none';
                resolve(values);
            };

            const cancel = () => {
                modalOverlay.style.display = 'none';
                resolve(null);
            };

            modalOverlay.querySelector('#modalConfirm').onclick = confirm;
            modalOverlay.querySelector('#modalCancel').onclick = cancel;
            modalOverlay.querySelector('.close-modal').onclick = cancel;
        });
    }

    async function showAlert(title, message, isConfirm = false) {
        return new Promise(resolve => {
            alertOverlay.style.display = 'flex';
            document.getElementById('alertTitle').textContent = title;
            document.getElementById('alertMessage').textContent = message;
            
            const alertFooter = document.querySelector('.alert-footer');
            alertFooter.innerHTML = '';

            if (isConfirm) {
                const confirmBtn = document.createElement('button');
                confirmBtn.className = 'mac-btn';
                confirmBtn.textContent = 'Confirmer';
                confirmBtn.onclick = () => {
                    alertOverlay.style.display = 'none';
                    resolve(true);
                };

                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'mac-btn';
                cancelBtn.textContent = 'Annuler';
                cancelBtn.onclick = () => {
                    alertOverlay.style.display = 'none';
                    resolve(false);
                };

                alertFooter.appendChild(confirmBtn);
                alertFooter.appendChild(cancelBtn);
            } else {
                const okBtn = document.createElement('button');
                okBtn.className = 'mac-btn';
                okBtn.textContent = 'OK';
                okBtn.onclick = () => {
                    alertOverlay.style.display = 'none';
                    resolve(true);
                };
                alertFooter.appendChild(okBtn);
            }
        });
    }

    buttons.modify.addEventListener('click', async () => {
        const result = await showModal('Authentification', [{
            placeholder: 'Mot de passe',
            type: 'password',
            autofocus: true
        }]);

        if (result && CryptoJS.MD5(result[0]).toString() === PASSWORD_HASH) {
            Object.values(buttons).forEach(b => b.disabled = false);
            buttons.modify.disabled = true;
            await showAlert('Succès', 'Fonctionnalités débloquées !');
        } else if (result) {
            await showAlert('Erreur', 'Mot de passe incorrect !');
        }
    });

    async function addLink() {
        const result = await showModal('Nouveau raccourci', [
            { placeholder: 'URL du site (https://...)' },
            { placeholder: 'URL de l\'icône (facultatif)' },
            { placeholder: 'Nom du raccourci (facultatif)' }
        ]);

        if (result?.[0]) {
            const [url, icon, desc] = result;
            links.push({ url, iconUrl: icon || 'icons/default.png', description: desc });
            updateLinksDisplay();
            await showAlert('Succès', 'Raccourci ajouté !');
        }
    }

    function toggleDeleteMode() {
        deleteMode = !deleteMode;
        buttons.delete.classList.toggle('active', deleteMode);
        
        linksContainer.querySelectorAll('a').forEach(link => {
            link.querySelector('.delete-cross')?.remove();

            if (deleteMode) {
                const cross = document.createElement('div');
                cross.className = 'delete-cross';
                cross.innerHTML = '✕';
                cross.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const confirmed = await showAlert('Confirmer', 'Supprimer ce raccourci ?', true);
                    if (confirmed) {
                        const url = link.href.replace(window.location.origin, '');
                        const index = links.findIndex(l => l.url === url);
                        links.splice(index, 1);
                        link.remove();
                        updateLinksDisplay();
                    }
                };
                link.appendChild(cross);
            }
        });
    }

    function updateLinksDisplay() {
        linksContainer.innerHTML = '';
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.innerHTML = `
                <img src="${link.iconUrl}" alt="${link.description}">
                <span>${link.description || 'Nouveau raccourci'}</span>
            `;
            linksContainer.appendChild(a);
        });
        localStorage.setItem('links', JSON.stringify(links));
        document.querySelector('.empty-message').style.display = links.length ? 'none' : 'block';
    }

    async function updateProfile() {
        const result = await showModal('Profil', [{
            placeholder: 'Nouveau nom',
            value: localStorage.getItem('userName') || ''
        }]);
        
        if (result?.[0]) {
            localStorage.setItem('userName', result[0]);
            updateGreeting();
        }
    }

    function updateGreeting() {
        const date = new Date();
        const hours = date.getHours();
        const userName = localStorage.getItem('userName') || 'Utilisateur';
        
        let greeting = 'Bonsoir';
        if (hours < 12) greeting = 'Bonjour';
        else if (hours < 18) greeting = 'Bon après-midi';

        greetingContainer.innerHTML = `
            ${greeting}, <strong>${userName}</strong> !<br>
            Nous sommes le ${date.toLocaleDateString('fr-FR')}
        `;
    }

    async function exportLinks() {
        const data = links.map(l => `${l.url},${l.iconUrl},${l.description}`).join('\n');
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sauvegarde-${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        await showAlert('Sauvegarde', 'Fichier exporté avec succès !');
    }

    async function importLinks() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const text = await file.text();
            links = text.split('\n').map(line => {
                const [url, iconUrl, description] = line.split(',');
                return { url, iconUrl, description };
            }).filter(l => l.url);

            updateLinksDisplay();
            await showAlert('Import', `${links.length} raccourcis importés !`);
        };

        input.click();
    }

    function updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        document.getElementById('clock').textContent = `Il est ${hours}h${minutes} ⏰`;
    }

    function performSearch(searchEngine) {
        const query = searchInput.value.trim();
        if (query) {
            const searchUrl = searchEngine === 'brave' 
                ? `https://search.brave.com/search?q=${encodeURIComponent(query)}`
                : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            
            window.open(searchUrl, '_blank');
            searchInput.value = '';
        }
    }

    searchButton.addEventListener('click', () => performSearch('brave'));
    searchButton2.addEventListener('click', () => performSearch('google'));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch('brave');
    });

    function init() {
        themeToggle.addEventListener('click', toggleTheme);
        buttons.add.addEventListener('click', addLink);
        buttons.delete.addEventListener('click', toggleDeleteMode);
        buttons.save.addEventListener('click', exportLinks);
        buttons.import.addEventListener('click', importLinks);
        buttons.profile.addEventListener('click', updateProfile);
        
        document.body.dataset.theme = localStorage.getItem('theme') || 'light';
        themeToggle.textContent = document.body.dataset.theme === 'dark' ? '☀️' : '🌙';
        updateGreeting();
        updateLinksDisplay();
        
        setInterval(updateClock, 1000);
        updateClock();
    }

    init();
});