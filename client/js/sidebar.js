// Shared sidebar HTML — injected into every dashboard page
function renderSidebar(activePage = '') {
    const user = auth.getUser();
    const isAdmin = user?.role === 'admin';

    return `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
            <div class="logo-icon">
                <svg viewBox="0 0 24 24" fill="#0B0F1A"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z"/></svg>
            </div>
            <span>EchoNote</span>
        </div>

        <nav class="sidebar-nav">
            <ul>
                <li class="nav-item">
                    <a href="dashboard.html" class="${activePage==='dashboard'?'active':''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a href="upload.html" class="${activePage==='upload'?'active':''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                        Upload Audio
                    </a>
                </li>
                <li class="nav-item">
                    <a href="transcripts.html" class="${activePage==='transcripts'?'active':''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        My Transcripts
                    </a>
                </li>
                <li class="nav-item">
                    <a href="search.html" class="${activePage==='search'?'active':''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        Search Notes
                    </a>
                </li>
            </ul>

            ${isAdmin ? `
            <div class="nav-section">
                <div class="nav-section-label">Admin</div>
                <ul>
                    <li class="nav-item">
                        <a href="admin.html" class="${activePage==='admin'?'active':''}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            Admin Dashboard
                        </a>
                    </li>
                </ul>
            </div>` : ''}
        </nav>

        <div class="sidebar-footer">
            <div class="user-info" id="user-info-btn">
                <div class="user-avatar" id="sidebar-avatar">${getInitials(user?.username || 'U')}</div>
                <div>
                    <div class="user-name" id="sidebar-username">${user?.username || 'User'}</div>
                    <div class="user-role">${user?.role === 'admin' ? 'Administrator' : 'Member'}</div>
                </div>
            </div>
            <button id="logout-btn" class="btn btn-ghost btn-sm w-full mt-1" style="justify-content:center;" onclick="logout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Log out
            </button>
        </div>
    </aside>`;
}
