// ============================================
// EchoNote – Frontend API Client
// ============================================

const API_BASE = '/api';

// ── Token management ──
const auth = {
    getToken: () => localStorage.getItem('echonote_token'),
    getUser:  () => JSON.parse(localStorage.getItem('echonote_user') || 'null'),
    setSession: (token, user) => {
        localStorage.setItem('echonote_token', token);
        localStorage.setItem('echonote_user', JSON.stringify(user));
    },
    clearSession: () => {
        localStorage.removeItem('echonote_token');
        localStorage.removeItem('echonote_user');
    },
    isLoggedIn: () => !!localStorage.getItem('echonote_token'),
    isAdmin: () => {
        const user = JSON.parse(localStorage.getItem('echonote_user') || 'null');
        return user?.role === 'admin';
    }
};

// ── HTTP client ──
async function apiRequest(endpoint, options = {}) {
    const token = auth.getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, config);
        if (res.status === 401) {
            auth.clearSession();
            window.location.href = '/login.html';
            return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    } catch (err) {
        throw err;
    }
}

// ── Toast notifications ──
function showToast(message, type = 'success', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✕', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ── Format helpers ──
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
}

function formatRelativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    const hr  = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 1)  return 'just now';
    if (min < 60) return `${min}m ago`;
    if (hr < 24)  return `${hr}h ago`;
    if (day < 7)  return `${day}d ago`;
    return formatDate(dateStr);
}

function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
}

function statusBadge(status) {
    const map = {
        completed:  'badge-success',
        processing: 'badge-warning',
        pending:    'badge-neutral',
        failed:     'badge-danger'
    };
    return `<span class="badge ${map[status] || 'badge-neutral'}">${status}</span>`;
}

// ── Guard: require login ──
function requireAuth() {
    if (!auth.isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!auth.isAdmin()) {
        window.location.href = '/dashboard.html';
        return false;
    }
    return true;
}

// ── Sidebar active state ──
function setActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') && path.includes(link.getAttribute('href').split('/').pop().replace('.html',''))) {
            link.classList.add('active');
        }
    });
}

// ── Populate sidebar user info ──
function populateSidebarUser() {
    const user = auth.getUser();
    if (!user) return;
    const nameEl = document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');
    const avatarEl = document.querySelector('.user-avatar');
    if (nameEl) nameEl.textContent = user.username;
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'User';
    if (avatarEl) avatarEl.textContent = getInitials(user.username);
}

// ── Logout ──
function logout() {
    auth.clearSession();
    window.location.href = '/login.html';
}

// ── Mobile sidebar toggle ──
function initMobileNav() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
}

// ── Copy to clipboard ──
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
    } catch {
        showToast('Copy failed', 'error');
    }
}

// Init on every page
document.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    populateSidebarUser();
    initMobileNav();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});