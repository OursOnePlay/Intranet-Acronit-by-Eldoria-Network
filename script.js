document.addEventListener("DOMContentLoaded", function() {
    const linksContainer = document.getElementById('linksContainer');
    const addLinkButton = document.getElementById('addLinkButton');
    const deleteButton = document.getElementById('deleteButton');
    const greetingContainer = document.getElementById('greeting');
    const changeNameButton = document.getElementById('changeNameButton');
    let links = [];
    let deleteMode = false;

    function updateClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;

        updateGreeting(hours);
    }

    function updateGreeting(hours) {
        let greeting = '';
        if (hours >= 5 && hours < 12) {
            greeting = 'Bonjour';
        } else if (hours >= 12 && hours < 18) {
            greeting = 'Bon après-midi';
        } else {
            greeting = 'Bonsoir';
        }
        greetingContainer.textContent = `${greeting}, ${getUserName()}`;
    }

    function getUserName() {
        let userName = localStorage.getItem('userName');
        if (!userName) {
            userName = prompt("Entrez votre nom d'utilisateur :") || "Utilisateur";
            localStorage.setItem('userName', userName);
        }
        return userName;
    }

    function addLink() {
        const url = prompt("Entrez l'URL du site :");
        if (url) {
            const iconName = prompt("Entrez le nom de l'icône (facultatif) :");
            const iconUrl = prompt("Entrez l'URL de l'icône (facultatif) :");
            const description = prompt("Entrez une description du site (facultatif) :");
            const link = document.createElement('a');
            const icon = document.createElement('img');
            const text = document.createElement('span');
            icon.setAttribute('alt', iconName || "Site");
            icon.setAttribute('src', iconUrl || "default-icon.png");
            text.textContent = description || "";
            link.setAttribute('href', url);
            link.setAttribute('target', '_blank');
            link.appendChild(icon);
            link.appendChild(text);
            linksContainer.appendChild(link);
            links.push({ url, iconName, iconUrl, description });
            updateEmptyMessage();
            saveLinksToStorage();
        }
    }

    function deleteLinks() {
        if (!deleteMode) {
            deleteButton.classList.add('active');
            deleteMode = true;
            linksContainer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', removeLink);
                link.setAttribute('href', 'javascript:void(0);');
            });
        } else {
            deleteButton.classList.remove('active');
            deleteMode = false;
            linksContainer.querySelectorAll('a').forEach(link => {
                link.removeEventListener('click', removeLink);
                link.setAttribute('href', link.dataset.href);
            });
        }
    }

    function removeLink(event) {
        const indexToRemove = Array.from(linksContainer.querySelectorAll('a')).indexOf(event.currentTarget);
        linksContainer.removeChild(event.currentTarget);
        links.splice(indexToRemove, 1);
        saveLinksToStorage();
        updateEmptyMessage();
        event.preventDefault();
        event.stopPropagation();
    }

    function updateEmptyMessage() {
        const emptyMessage = document.querySelector('.empty-message');
        emptyMessage.classList.toggle('active', links.length === 0);
    }

    function saveLinksToStorage() {
        localStorage.setItem('links', JSON.stringify(links));
    }

    function loadLinksFromStorage() {
        const storedLinks = localStorage.getItem('links');
        if (storedLinks) {
            links = JSON.parse(storedLinks);
            links.forEach(link => {
                const { url, iconName, iconUrl, description } = link;
                const linkElement = document.createElement('a');
                const iconElement = document.createElement('img');
                const textElement = document.createElement('span');
                iconElement.setAttribute('src', iconUrl || 'default-icon.png');
                iconElement.setAttribute('alt', iconName || 'Site');
                textElement.textContent = description || '';
                linkElement.setAttribute('href', url);
                linkElement.setAttribute('target', '_blank');
                linkElement.appendChild(iconElement);
                linkElement.appendChild(textElement);
                linksContainer.appendChild(linkElement);
            });
            updateEmptyMessage();
        }
    }

    addLinkButton.addEventListener('click', addLink);
    deleteButton.addEventListener('click', deleteLinks);
    changeNameButton.addEventListener('click', () => {
        localStorage.removeItem('userName');
        updateGreeting(new Date().getHours());
    });

    setInterval(updateClock, 1000);
    loadLinksFromStorage();
});
