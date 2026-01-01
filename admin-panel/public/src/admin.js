/**
 * EchoMemory Admin Console Logic
 */

const API_BASE = "http://localhost/echomemory/backend-server/api/admin";
const AUTH_URL = "http://localhost/echomemory/backend-server/api/admin/login.php";

const views = {
    login: document.getElementById('admin-login-view'),
    dashboard: document.getElementById('admin-dashboard')
};

function switchView(viewName) {
    Object.keys(views).forEach(v => {
        views[v].classList.toggle('hidden', v !== viewName);
    });
    document.getElementById('sidebar').classList.toggle('hidden', viewName === 'login');
}

// 1. Authentication
const loginForm = document.getElementById('admin-login-form');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-user').value;
    const password = document.getElementById('admin-pass').value;

    try {
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        if (result.status === 'success') {
            localStorage.setItem('em_admin_token', result.data.token);
            initAdminDashboard();
        } else {
            alert(result.message);
        }
    } catch (err) {
        alert("Admin API unavailable.");
    }
});

// 2. Dashboard Logic
async function initAdminDashboard() {
    const token = localStorage.getItem('em_admin_token');
    if (!token) return switchView('login');

    switchView('dashboard');
    fetchStats();
}

async function fetchStats() {
    const token = localStorage.getItem('em_admin_token');
    try {
        const response = await fetch(API_BASE + '/stats.php', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.status === 'success') {
            updateDashboard(result.data);
        }
    } catch (err) {
        console.error("Dashboard stats failed");
    }
}

function updateDashboard(data) {
    document.getElementById('stat-users').textContent = data.total_users;
    document.getElementById('stat-memories').textContent = data.total_memories;
    document.getElementById('stat-conf').textContent = data.avg_confidence;
    document.getElementById('stat-alerts').textContent = data.security_alerts;

    const auditList = document.getElementById('audit-list');
    auditList.innerHTML = data.recent_audits.map(a => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 ${a.action.includes('failed') ? 'border-red-500' : 'border-indigo-500'}">
            <div>
                <p class="font-semibold text-sm">${a.action.replace('_', ' ').toUpperCase()}</p>
                <p class="text-xs text-gray-500">${a.ip_address} | ${a.created_at}</p>
            </div>
            <span class="text-[10px] bg-white px-2 py-1 rounded border">${a.entity_type || 'SYSTEM'}</span>
        </div>
    `).join('');
}

// 3. Init
if (localStorage.getItem('em_admin_token')) {
    initAdminDashboard();
}

document.getElementById('admin-logout').addEventListener('click', () => {
    localStorage.removeItem('em_admin_token');
    window.location.reload();
});
