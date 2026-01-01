/**
 * EchoMemory Web Client Core v2.1
 * Structural State Manager & Neural Explorer
 */

const API_BASE = "http://localhost/echomemory/backend-server/api";
let currentLang = localStorage.getItem('em_lang') || 'en';
let selectedRating = 0;
let isDark = localStorage.getItem('em_theme') !== 'light';

// Initialize Theme
if (!isDark) document.body.classList.add('light-mode');
updateThemeIcon();

function toggleTheme() {
    isDark = !isDark;
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('em_theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    icon.innerHTML = isDark
        ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
        : '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>';
}

document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

// 1. View & State Management
const views = {
    landing: document.getElementById('landing-view'),
    shell: document.getElementById('app-shell'),
    home: document.getElementById('home-view'),
    dashboard: document.getElementById('dashboard-view'),
    profile: document.getElementById('profile-view'),
    settings: document.getElementById('settings-view')
};

function switchView(viewName) {
    // Top-level switch (Landing vs Shell)
    const shellViews = ['home', 'dashboard', 'profile', 'settings'];
    const isShellView = shellViews.includes(viewName);

    const token = localStorage.getItem('em_token');
    views.landing.classList.toggle('hidden', !!token);
    views.shell.classList.toggle('hidden', !token);

    // Inner Shell switch
    if (isShellView) {
        shellViews.forEach(v => {
            if (views[v]) views[v].classList.toggle('hidden', v !== viewName);
        });

        document.querySelectorAll('.side-nav .nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });
    }

    if (viewName === 'profile') renderProfileData();
}

// Global Scroll Helper
window.scrollToAuth = (mode) => {
    if (mode === 'register') toggleAuthMode(false); // Force register
    else toggleAuthMode(true); // Force login
    document.getElementById('auth-anchor').scrollIntoView({ behavior: 'smooth' });
};

// 2. Authentication Interaction
const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('auth-submit');
        const isLogin = submitBtn.textContent.includes('Unlock');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const fullName = document.getElementById('full_name').value;

        try {
            const body = isLogin ? { email, password } : { email, password, full_name: fullName, language_code: currentLang };
            const response = await fetch(API_BASE + (isLogin ? '/login.php' : '/register.php'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();

            if (result.status === 'success') {
                if (isLogin) {
                    localStorage.setItem('em_token', result.data.token);
                    localStorage.setItem('em_user', JSON.stringify(result.data.user));
                    initEliteSession();
                } else {
                    alert("Identity Initialized. You may now unlock your console.");
                    toggleAuthMode(true);
                }
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert("Connection error.");
        }
    });
}

function toggleAuthMode(forceLogin) {
    const title = document.getElementById('view-title');
    const submit = document.getElementById('auth-submit');
    const toggle = document.getElementById('toggle-auth');
    const nameField = document.getElementById('name-field');

    // If forceLogin is provided, use it; otherwise toggle
    const shouldGoToLogin = typeof forceLogin === 'boolean' ? forceLogin : !submit.textContent.includes('Unlock');

    title.textContent = shouldGoToLogin ? "Access Console" : "New Identity";
    submit.textContent = shouldGoToLogin ? "Unlock Console" : "Initialize Identity";
    toggle.textContent = shouldGoToLogin ? "New Identity? Register" : "Existing Identity? Login";
    nameField.classList.toggle('hidden', shouldGoToLogin);
}

const toggleAuthBtn = document.getElementById('toggle-auth');
if (toggleAuthBtn) {
    toggleAuthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}

// 3. Authenticated Session Logic
function initEliteSession() {
    const bubble = document.getElementById('chatbot-bubble-elite');
    if (bubble) bubble.classList.remove('hidden');
    switchView('home');
    fetchMemories();
}

// Chatbot Activation Logic
const chatBubble = document.getElementById('chatbot-bubble-elite');
const chatWindow = document.getElementById('chatbot-window-elite');
const chatClose = document.getElementById('close-chat');

if (chatBubble && chatWindow) {
    chatBubble.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatBubble.style.opacity = '0';
            setTimeout(() => chatBubble.classList.add('hidden'), 300);
        }
    });
} else {
    console.error("Chatbot elements missing from DOM");
}

if (chatClose && chatWindow && chatBubble) {
    chatClose.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
        chatBubble.classList.remove('hidden');
        setTimeout(() => chatBubble.style.opacity = '1', 10);
    });
}

// Chatbot Transmission logic
const chatSend = document.getElementById('chat-send');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append User Message
    chatMessages.innerHTML += `<div class="message user" style="background: var(--primary-core); color: white; padding: 1rem; border-radius: 1.25rem 1.25rem 0.25rem 1.25rem; align-self: flex-end; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.1);">${text}</div>`;
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(API_BASE + '/chat.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('em_token')}`
            },
            body: JSON.stringify({ message: text })
        });
        const result = await response.json();

        // Append Bot Message
        chatMessages.innerHTML += `<div class="message bot" style="background: var(--bg-deep); color: var(--text-vibrant); padding: 1rem; border-radius: 1.25rem 1.25rem 1.25rem 0.25rem; margin-top: 1rem; border: 1px solid var(--border-glass);">${result.response || result.message}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
        chatMessages.innerHTML += `<div class="message sys" style="color: var(--danger-core); font-size: 0.75rem; margin-top: 1rem;">Neural link error. Reconstruction failed.</div>`;
    }
}

chatSend?.addEventListener('click', sendChatMessage);
chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// Mic & Camera Placeholders
document.getElementById('chat-mic')?.addEventListener('click', () => {
    alert("Voice Neural Sync initialized. (Microphone access pending)");
});

document.getElementById('chat-camera')?.addEventListener('click', () => {
    alert("Visual Neural Anchor initialized. (Camera access pending)");
});

// Footer Feedback Logic
const footerRatingPills = document.querySelectorAll('.shell-footer .rating-pill');
footerRatingPills.forEach(pill => {
    pill.addEventListener('click', () => {
        footerRatingPills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        selectedRating = pill.dataset.value;
    });
});

const footerFeedbackBtn = document.getElementById('footer-feedback-btn');
if (footerFeedbackBtn) {
    footerFeedbackBtn.addEventListener('click', async () => {
        if (!selectedRating) return alert("Select a rating first.");
        const token = localStorage.getItem('em_token');
        try {
            const response = await fetch(API_BASE + '/feedback.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating: selectedRating, comment: "Footer Quick Rating" })
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert("Insight transmitted.");
                footerRatingPills.forEach(p => p.classList.remove('selected'));
                selectedRating = 0;
            }
        } catch (err) { alert("Transmission failed."); }
    });
}

function renderProfileData() {
    const user = JSON.parse(localStorage.getItem('em_user'));
    const container = document.getElementById('profile-container');
    if (!user || !container) return;

    container.innerHTML = `
        <div class="flex items-center gap-8 mb-12">
            <div class="w-32 h-32 bg-indigo-500/10 border border-primary-core/20 rounded-3xl flex items-center justify-center text-5xl font-bold text-primary-core">
                ${user.full_name ? user.full_name[0] : 'U'}
            </div>
            <div>
                <h3 class="text-3xl font-bold">${user.full_name || 'Anonymous'}</h3>
                <p class="text-soft text-lg">${user.email}</p>
            </div>
        </div>
        <div class="grid md-cols-2 gap-6">
            <div class="p-6 glass-panel" style="background: rgba(0,0,0,0.2);">
                <span class="text-[0.6rem] text-dim uppercase tracking-widest block mb-1">Status</span>
                <span class="text-emerald-400 font-bold">Neural Link Verified</span>
            </div>
            <div class="p-6 glass-panel" style="background: rgba(0,0,0,0.2);">
                <span class="text-[0.6rem] text-dim uppercase tracking-widest block mb-1">Last Synchronized</span>
                <span class="text-soft font-bold">Active Now</span>
            </div>
        </div>
    `;
}

// 4. Feedback Logic
const ratingPills = document.querySelectorAll('.rating-pill');
ratingPills.forEach(pill => {
    pill.addEventListener('click', () => {
        ratingPills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        selectedRating = pill.dataset.value;
    });
});

const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedRating) return alert("Select a rating first.");

        const comment = document.getElementById('feedback-comment').value;
        const token = localStorage.getItem('em_token');

        try {
            const response = await fetch(API_BASE + '/feedback.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating: selectedRating, comment })
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert("Insight transmitted. Thank you for refining the neural network.");
                feedbackForm.reset();
                ratingPills.forEach(p => p.classList.remove('selected'));
                selectedRating = 0;
            }
        } catch (err) {
            alert("Transmission failed.");
        }
    });
}

// Navigation Events for Shell
document.querySelectorAll('.side-nav .nav-link').forEach(link => {
    if (link.dataset.view) {
        link.addEventListener('click', () => switchView(link.dataset.view));
    }
});

// 5. Memory Stream
async function fetchMemories() {
    const token = localStorage.getItem('em_token');
    if (!token) return;
    try {
        const response = await fetch(API_BASE + '/memories.php', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.status === 'success') renderMemories(result.data);
    } catch (err) { console.error(err); }
}

function renderMemories(memories) {
    const list = document.getElementById('memory-list');
    if (!list) return;
    list.innerHTML = memories.map(m => `
        <div class="memory-card-elite glass-panel animate-fade" onclick="openMemoryModal(${JSON.stringify(m).replace(/"/g, '&quot;')})">
            <span class="source-tag">${m.source_type}</span>
            <p class="narrative-preview">${m.narrative_text || 'Synthesizing...'}</p>
            <div class="flex justify-between items-center mt-4">
                 <div class="confidence-indicator flex-grow mr-4">
                    <div class="confidence-progress" style="width: ${m.confidence_score * 100}%"></div>
                 </div>
                 <span class="text-[0.6rem] font-bold text-dim">${Math.round(m.confidence_score * 100)}%</span>
            </div>
        </div>
    `).join('');
}

window.openMemoryModal = (memory) => {
    const modal = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');

    let mediaHtml = '';
    if (memory.media_path) {
        const isVideo = memory.media_path.endsWith('.mp4');
        mediaHtml = `<div class="media-container mb-6">${isVideo ? `<video src="${memory.media_path}" controls class="w-full rounded-3xl"></video>` : `<img src="${memory.media_path}" class="w-full rounded-3xl">`}</div>`;
    }

    content.innerHTML = `
        <h2 class="text-4xl font-black mb-6">Reconstruction</h2>
        ${mediaHtml}
        <div class="p-8 glass-panel italic text-2xl text-slate-200 mb-8" style="background: rgba(255,255,255,0.02);">
            "${memory.narrative_text}"
        </div>
        <button class="btn-elite w-full" onclick="closeModal()">Close Reconstruction</button>
    `;
    modal.classList.remove('hidden');
};

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}
window.closeModal = closeModal;
document.getElementById('close-modal').addEventListener('click', closeModal);

// 6. Init
if (localStorage.getItem('em_token')) {
    initEliteSession();
} else {
    switchView('landing');
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });
}
