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
    if (views.landing) views.landing.classList.toggle('hidden', !!token);
    if (views.shell) views.shell.classList.toggle('hidden', !token);

    // Inner Shell switch
    if (isShellView) {
        shellViews.forEach(v => {
            if (views[v]) views[v].classList.toggle('hidden', v !== viewName);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });

        // Auto-close mobile nav on switch
        document.getElementById('mobile-nav-panel')?.classList.add('hidden');

        if (viewName === 'profile') renderProfileData();
    }
}

// Global Nav Helper
window.goToPage = (page) => {
    window.location.href = page;
};

// 2. Authentication Interaction
const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('auth-submit');
        const isLogin = submitBtn.textContent.includes('Unlock');

        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const fullName = document.getElementById('full_name')?.value;

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
                    window.location.href = 'index.html';
                } else {
                    alert("Identity Initialized. You may now unlock your console.");
                    window.location.href = 'login.html';
                }
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert("Connection error.");
        }
    });
}

// Legacy Auth Toggles (Kept for compatibility if partially loaded)
function toggleAuthMode() { }

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

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
            chatBubble.classList.remove('hidden');
            setTimeout(() => chatBubble.style.opacity = '1', 10);
        });
    }
}

// 2. Neural Assistant Persistence & Revision
const chatSend = document.getElementById('chat-send');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

let lastUserMessageId = null;
let chatHistory = [];

async function fetchHistory() {
    const token = localStorage.getItem('em_token');
    if (!token) return;
    try {
        const response = await fetch(API_BASE + '/history.php', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.status === 'success') {
            chatHistory = result.data;
            renderHistory();
        }
    } catch (err) { console.error("History retrieval failed:", err); }
}

function renderHistory() {
    const historyContent = document.getElementById('history-content');
    if (!historyContent) return;

    historyContent.innerHTML = chatHistory.map(msg => `
        <div class="message ${msg.role}" style="${msg.role === 'user' ? 'background: var(--primary-core); color: white; padding: 1rem; border-radius: 1.25rem 1.25rem 0.25rem 1.25rem; align-self: flex-end; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.1);' : 'background: var(--bg-deep); color: var(--text-vibrant); padding: 1rem; border-radius: 1.25rem 1.25rem 1.25rem 0.25rem; margin-top: 1rem; border: 1px solid var(--border-glass);'}">
            ${msg.content}
            ${msg.is_edited ? '<span class="text-[0.5rem] opacity-50 block mt-1">Edited</span>' : ''}
        </div>
    `).join('');
}

function toggleHistory() {
    const msgView = document.getElementById('chat-messages');
    const histView = document.getElementById('chat-history-view');
    const isShowingHistory = !histView.classList.contains('hidden');

    msgView.classList.toggle('hidden', !isShowingHistory);
    histView.classList.toggle('hidden', isShowingHistory);

    if (!isShowingHistory) fetchHistory();
}

document.getElementById('toggle-history')?.addEventListener('click', toggleHistory);

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append User Message UI
    const msgHtml = `<div class="message user" style="background: var(--primary-core); color: white; padding: 1rem; border-radius: 1.25rem 1.25rem 0.25rem 1.25rem; align-self: flex-end; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.1); position: relative;">
        <span class="msg-text">${text}</span>
        <button class="edit-msg-btn" onclick="editLastMessage(this)" style="position: absolute; top: -10px; right: -10px; background: var(--bg-surface); border-radius: 50%; width: 20px; height: 20px; font-size: 0.6rem; border: 1px solid var(--border-glass); display: flex; items-center; justify-center; cursor: pointer;">✎</button>
    </div>`;

    chatMessages.innerHTML += msgHtml;
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

        // Append Bot Message UI
        chatMessages.innerHTML += `<div class="message bot" style="background: var(--bg-deep); color: var(--text-vibrant); padding: 1rem; border-radius: 1.25rem 1.25rem 1.25rem 0.25rem; margin-top: 1rem; border: 1px solid var(--border-glass);">${result.data.reply}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
        chatMessages.innerHTML += `<div class="message sys" style="color: var(--danger-core); font-size: 0.75rem; margin-top: 1rem;">Neural link error. Reconstruction failed.</div>`;
    }
}

window.editLastMessage = (btn) => {
    const msgDiv = btn.parentElement;
    const textSpan = msgDiv.querySelector('.msg-text');
    const oldText = textSpan.textContent;

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.value = oldText;
    newInput.className = 'input-elite';
    newInput.style.marginBottom = '0';
    newInput.style.fontSize = '0.9rem';

    newInput.onblur = () => {
        textSpan.textContent = newInput.value;
        msgDiv.removeChild(newInput);
        textSpan.style.display = 'inline';
        // In a full implementation, this would trigger an UPDATE API call
        console.log("Message updated in local view");
    };

    newInput.onkeydown = (e) => { if (e.key === 'Enter') newInput.blur(); };

    textSpan.style.display = 'none';
    msgDiv.insertBefore(newInput, textSpan);
    newInput.focus();
};

chatSend?.addEventListener('click', sendChatMessage);
chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// Chatbot Media Features (Voice & Vision)
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const chatMicBtn = document.getElementById('chat-mic');
const chatCameraBtn = document.getElementById('chat-camera');
const chatImageInput = document.getElementById('chat-media-input');
const chatCameraInput = document.getElementById('chat-camera-input');
const visualMenu = document.getElementById('visual-anchor-menu');

// 1. Visual Anchor Logic
chatCameraBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    visualMenu?.classList.toggle('hidden');
});

// Close menu on click outside
document.addEventListener('click', () => visualMenu?.classList.add('hidden'));

document.getElementById('btn-gallery-sync')?.addEventListener('click', () => {
    chatImageInput?.click();
    visualMenu?.classList.add('hidden');
});

document.getElementById('btn-camera-sync')?.addEventListener('click', () => {
    chatCameraInput?.click();
    visualMenu?.classList.add('hidden');
});

const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview in Chat
    const reader = new FileReader();
    reader.onload = (ev) => {
        chatMessages.innerHTML += `<div class="message user" style="align-self: flex-end; margin-top: 1rem;"><img src="${ev.target.result}" class="chat-media-preview"></div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    reader.readAsDataURL(file);

    await uploadChatMedia(file, 'image');
};

chatImageInput?.addEventListener('change', handleImageCapture);
chatCameraInput?.addEventListener('change', handleImageCapture);

// 2. Voice Neural Sync Logic
chatMicBtn?.addEventListener('click', async () => {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], "voice_fragment.webm", { type: 'audio/webm' });

                chatMessages.innerHTML += `<div class="message user" style="align-self: flex-end; margin-top: 1rem;"><div class="glass-panel p-3 text-xs">🎙️ Voice Fragment Transmitted</div></div>`;
                chatMessages.scrollTop = chatMessages.scrollHeight;

                await uploadChatMedia(audioFile, 'audio');

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            chatMicBtn.classList.add('recording');
        } catch (err) { alert("Microphone access denied."); }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        chatMicBtn.classList.remove('recording');
    }
});

async function uploadChatMedia(file, type) {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('type', type);

    try {
        const response = await fetch(API_BASE + '/upload.php', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('em_token')}` },
            body: formData
        });
        const result = await response.json();
        if (result.status === 'success') {
            // After upload, we could trigger a special chat command or just acknowledge
            console.log("Media synthesized:", result.data.file_path);
        }
    } catch (err) { console.error("Synthesis failed:", err); }
}

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

        const comment = document.getElementById('feedback-comment')?.value;
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
document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.view) {
        link.addEventListener('click', () => switchView(link.dataset.view));
    }
});

// Hamburger Toggle
const hamburger = document.getElementById('hamburger-trigger');
const mobileNav = document.getElementById('mobile-nav-panel');
hamburger?.addEventListener('click', () => {
    mobileNav?.classList.toggle('hidden');
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
document.getElementById('close-modal')?.addEventListener('click', closeModal);

// 6. Init
const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
const hasToken = !!localStorage.getItem('em_token');

if (hasToken) {
    if (isAuthPage) {
        window.location.href = 'index.html';
    } else if (views.shell) {
        initEliteSession();
    }
} else {
    if (!isAuthPage && views.landing) {
        switchView('landing');
    }
}

const handleLogout = () => {
    localStorage.clear();
    location.reload();
};

document.getElementById('logout-btn-top')?.addEventListener('click', handleLogout);
document.getElementById('logout-btn-mobile')?.addEventListener('click', handleLogout);
document.getElementById('logout-btn')?.addEventListener('click', handleLogout); // Backward compat
