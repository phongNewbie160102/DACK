document.addEventListener('DOMContentLoaded', () => {
    const page = location.pathname.substring(1) || 'home';
    if (page && !page.startsWith('login')) {
        loadPage(page);
    }

    document.querySelectorAll('nav a').forEach(link => {
        // Chỉ xử lý liên kết có thuộc tính data-link
        if (link.hasAttribute('data-link')) {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const page = event.target.getAttribute('data-link');
                navigateTo(page);
            });
        }
    });
});

async function loadPage(page) {
    try {
        const response = await fetch(`/pages/${page}.html`);
        if (!response.ok) {
            throw new Error('Page not found');
        }

        const html = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const appElement = document.getElementById('app');
        appElement.innerHTML = tempDiv.innerHTML;

        // Thực thi các script bên trong trang con
        tempDiv.querySelectorAll('script').forEach(script => {
            const scriptElement = document.createElement('script');
            if (script.src) {
                scriptElement.src = script.src;
                document.body.appendChild(scriptElement);
            } else {
                scriptElement.textContent = script.textContent;
                document.body.appendChild(scriptElement).parentNode.removeChild(scriptElement);
            }
        });

        // Khởi tạo dropdowns nếu cần
        if (typeof initializeComponents === 'function') {
            initializeComponents();
        }
    } catch (error) {
        console.error('Error loading page:', error);
        document.getElementById('app').innerHTML = '<h2>Page not found</h2>';
    }
}

function navigateTo(page) {
    if (page) {
        history.pushState({}, '', `/${page}`);
        loadPage(page);
    } else {
        console.error('Invalid page');
    }
}

window.onpopstate = function() {
    const page = location.pathname.substring(1) || 'home';
    if (page && !page.startsWith('login')) {
        loadPage(page);
    }
};
