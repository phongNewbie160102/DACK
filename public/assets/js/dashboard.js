document.addEventListener('DOMContentLoaded', function() {
    var token = localStorage.getItem('jwt');

    // Kiểm tra nếu không có token thì redirect về trang đăng nhập
    if (!token) {
        window.location.href = '../index.php'; 
        return;
    }
    
    // Hàm để parse JWT thành object
    function parseJwt(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    
        return JSON.parse(jsonPayload);
    }
    
    // Hàm kiểm tra JWT hết hạn
    function isJwtExpired(expireAt) {
        var currentTime = Date.now() / 1000;  
        return expireAt < currentTime;
    }

    // Decode JWT để lấy thông tin roles và kiểm tra thời gian hết hạn
    try {
        var tokenPayload = parseJwt(token);
        var roles = tokenPayload.roles;
        var expireAt = tokenPayload.exp;
    
        // Kiểm tra nếu không có roles thì redirect về trang đăng nhập
        if (!roles) {
            window.location.href = '../index.php'; 
            return;
        }
    
        // Kiểm tra nếu token hết hạn thì redirect về trang đăng nhập
        if (isJwtExpired(expireAt)) {

            // Xóa token khỏi localStorage
            localStorage.removeItem('jwt');
            window.location.href = '../index.php'; 

            return;
        }
    
        // Nếu token hợp lệ và chưa hết hạn, hiển thị roles
        document.getElementById('userRoles').innerText = roles;
    
    } catch (error) {
        console.error('Failed to parse JWT:', error);
        window.location.href = '../index.php';   
    }
    
    // Xử lý logic hiển thị menu dựa trên roles
    document.querySelectorAll('[data-role]').forEach(function(element) {
        var allowedRoles = element.getAttribute('data-role').split(' ');
        if (!allowedRoles.includes(roles)) {
            element.style.display = 'none';
        }
    });    
    
    // Normalize URLs to be case-insensitive and handle base URL differences
    function normalizeUrl(url) {
        return url.toLowerCase().replace(/^(https?:\/\/)?(localhost(:\d+)?\/|127.0.0.1(:\d+)?\/)?/, '');
    }
    
    // Get the base URL dynamically
    function getBaseUrl() {
        var protocol = window.location.protocol;
        var host = window.location.host;
        var pathname = window.location.pathname.split('/').slice(0, -1).join('/');
        return protocol + '//' + host + pathname + '/';
    }
    
    var baseUrl = getBaseUrl();
    var currentUrl = window.location.href;
    var normalizedCurrentUrl = normalizeUrl(currentUrl);
    var normalizedBaseUrl = normalizeUrl(baseUrl);
    
    // Redirect to the stored page if the base URL is loaded
    var lastVisitedPage = localStorage.getItem('lastVisitedPage');
    if (normalizedCurrentUrl === normalizedBaseUrl && lastVisitedPage) {
        window.location.href = lastVisitedPage;
    }
    
    // Synchronize active states between two sidebars
    function setActiveMenuItems(url) {
        var menuItems = document.querySelectorAll('#ms-side-nav .menu-item a');
        menuItems.forEach(function(menuItem) {
            var menuItemUrl = menuItem.href;
            var normalizedMenuItemUrl = normalizeUrl(menuItemUrl);
    
            if (normalizedMenuItemUrl === url) {
                menuItem.classList.add('active');
    
                // Show the collapsible parent menu if applicable
                var parentCollapse = menuItem.closest('.collapse');
                if (parentCollapse) {
                    parentCollapse.classList.add('show');
                    var parentMenuItem = parentCollapse.closest('.menu-item').querySelector('a.has-chevron');
                    if (parentMenuItem) {
                        parentMenuItem.setAttribute('aria-expanded', 'true');
                        parentMenuItem.classList.remove('collapsed');
                    }
                }
            } else {
                menuItem.classList.remove('active');
            }
        });
    }
    
    // Initialize active states on page load
    setActiveMenuItems(normalizedCurrentUrl);

    // Handle navigation link clicks with AJAX and update active state and localStorage
    $('.nav-link').click(function(e) {
        e.preventDefault();
        var page = $(this).data('page');
        var newUrl = window.location.href.split('?')[0] + '?page=' + page;
    
        // Lưu trang hiện tại vào localStorage trước khi chuyển trang
        localStorage.setItem('lastVisitedPage', newUrl);
    
        $.ajax({
            url: '../src/getpage.php',
            type: 'GET',
            data: { page: page, ajax: true },
            success: function(response) {
                $('#content-area').html(response);
    
                // Update active class and localStorage for sidebar navigation
                setActiveMenuItems(normalizeUrl(newUrl));
    
                // Gọi hàm initializePage sau khi nội dung được tải về
                if (typeof initializePage === 'function') {
                    initializePage();
                    
                }
            },
            error: function(xhr, status, error) {
                console.error(xhr.responseText);
            }
        });
        
    });
    
    // SIDEBAR State Management
    var bodyClasses = document.body.classList;
    var sidebarState = localStorage.getItem('sidebarState');
    if (sidebarState) {
        document.body.className = sidebarState;
    }
    
    // Toggle sidebar and save state in localStorage
    document.querySelectorAll('.ms-toggler').forEach(function(toggler) {
        toggler.addEventListener('click', function() {
            bodyClasses.toggle('ms-aside-left-open');
            bodyClasses.toggle('ms-aside-left-close');
            localStorage.setItem('sidebarState', bodyClasses.value);
        });
    });
    
    // Khi reload và không có trang trong URL, load trang gần đây nhất từ localStorage
    if (!currentUrl.includes('?page=')) {
        var lastVisitedPage = localStorage.getItem('lastVisitedPage');
        if (lastVisitedPage) {
            // Thực hiện AJAX request với trang gần đây nhất
            var page = lastVisitedPage.split('?page=')[1];
            $.ajax({
                url: '../src/getpage.php',
                type: 'GET',
                data: { page: page, ajax: true },
                success: function(response) {
                    $('#content-area').html(response);
                    // Cập nhật trạng thái active và localStorage cho điều hướng thanh bên
                    setActiveMenuItems(normalizeUrl(lastVisitedPage));
                    // Gọi hàm initializePage sau khi nội dung được tải về
                    if (typeof initializePage === 'function') {
                        initializePage();
                        changeLanguage();
                    }
                },
                error: function(xhr, status, error) {
                    console.error(xhr.responseText);
                }
            });
        }
    }
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
});
