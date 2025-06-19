document.addEventListener('DOMContentLoaded', () => {

// --- PRELOADER LOGIC ---
window.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const algos = document.querySelectorAll('.preloader-algos .algo');
    let algoIdx = 0;

    // Animate algorithms one by one
    if (algos.length) {
        setInterval(() => {
            algos.forEach((a, i) => a.classList.toggle('active', i === algoIdx));
            algoIdx = (algoIdx + 1) % algos.length;
        }, 520);
    }

    // Hide preloader after everything loaded (or after a timeout)
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hide');
        }, 2700); // adjust time as needed
    });
});

const clearHistoryBtn = document.getElementById('clear-history-btn');

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
            localStorage.removeItem('dsa_mentor_chat_history_v2');
            location.reload();
        }
    });
}

// --- CONFIGURATION ---
const API_KEY = "AIzaSyCP-eyND0AVISwsCtXJvF_nzPtKFARM8Ps"; // Your new API Key
const MODEL_NAME = "gemini-1.5-flash";
const HISTORY_KEY = "dsa_mentor_chat_history_v2";
const MAX_HISTORY_ITEMS = 10;

// System instructions
const dsaMentorInstruction = `You are "DSA Mentor," a world-class AI assistant specializing in Data Structures and Algorithms. Your goal is to be the best DSA instructor in the world.

Your personality is:
- **Professional & Encouraging:** You are patient, clear, and supportive.
- **Structured:** You break down complex topics into simple, digestible parts.
- **In-depth:** You explain the "why" behind concepts, not just the "how."

**Formatting Rules (MANDATORY):**
- Use Markdown for all your responses to make them clean and readable.
- **Headings:** Use '##' for main topics and '###' for sub-topics. (e.g., ## What is a Hash Table?)
- **Lists:** Use bullet points ('* ') for unordered lists and numbered lists ('1. ') for steps.
- **Bold/Italics:** Use '**' for bolding key terms (**Time Complexity**) and '*' for italics (*O(n)*).
- **Code Blocks:** ALWAYS use fenced code blocks with the language specified (e.g., \`\`\`cpp ... \`\`\`).

**Teaching Principles:**
1.  **First Principles:** Always start by explaining the core problem a data structure or algorithm solves. Why does it exist?
2.  **Simple Analogy:** Use a simple real-world analogy to explain the concept.
3.  **Core Explanation:** Provide a clear, technical definition and explanation.
4.  **Code Example:** Give a clean, well-commented code example in a relevant language (ask the user for preference if unsure, otherwise default to Python or C++).
5.  **Complexity Analysis:** Clearly state and explain the Time and Space Complexity.
6.  **Pros & Cons:** Briefly list the advantages and disadvantages or common use cases.

**Interaction Style:**
- Never reveal you are an AI. You are the "DSA Mentor."
- Keep responses focused on the user's question.
- If the user asks for a complete solution to a problem, guide them by breaking the problem down instead of giving the full answer away. Ask them questions to lead them to the solution.
- Start the very first message of a new chat with: "Hello! I'm your DSA Mentor. How can I help you with data structures and algorithms today?"`;

const codeMentorInstruction = `You are a "Code Debugger". Your sole purpose is to analyze and fix code snippets.
- **Direct & Technical:** Get straight to the point.
- **Identify Errors:** Pinpoint logical errors, syntax errors, and potential bugs.
- **Suggest Fixes:** Provide corrected code snippets using markdown code blocks.
- **Explain the Fix:** Briefly explain *why* the fix works.
- **Optimization:** If possible, suggest performance optimizations.
- Do not engage in general conversation. Focus only on the code provided.`;

// --- DOM ELEMENTS ---
const chatBox = document.getElementById('chat-box');
const inputForm = document.getElementById('input-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const voiceButton = document.getElementById('voice-button');
const voiceUI = document.getElementById('voice-ui');
const cancelVoiceBtn = document.getElementById('cancel-voice');
const historyBtn = document.getElementById('history-btn');
const chatHistory = document.getElementById('chat-history');
const closeHistory = document.getElementById('close-history');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const newChatHeaderBtn = document.getElementById('new-chat-header-btn');
const mentorMode = document.getElementById('mentor-mode');
const featuresBtn = document.getElementById('features-btn');
const featureTour = document.getElementById('feature-tour');
const overlay = document.getElementById('overlay');
const closeTour = document.getElementById('close-tour');
const deleteConfirmModal = document.getElementById('delete-confirm');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const editTitleModal = document.getElementById('edit-title-modal');
const newChatTitleInput = document.getElementById('new-chat-title');
const saveTitleBtn = document.getElementById('save-title');
const cancelEditBtn = document.getElementById('cancel-edit');
const floatingPremium = document.getElementById('floating-premium');
// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// --- THEME MODE LOGIC ---
function setThemeMode(mode) {
    if (mode === 'light') {
        body.classList.add('light-mode');
        themeToggle.checked = true;
    } else {
        body.classList.remove('light-mode');
        themeToggle.checked = false;
    }
    try { localStorage.setItem('dsa_mentor_theme', mode); } catch(e){}
}
function loadThemeMode() {
    let mode = 'dark';
    try {
        mode = localStorage.getItem('dsa_mentor_theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    } catch (e) {}
    setThemeMode(mode);
}
themeToggle.addEventListener('change', () => {
    setThemeMode(themeToggle.checked ? 'light' : 'dark');
});
// On page load
loadThemeMode();

// --- STATE MANAGEMENT ---
let history = [];
let isRecording = false;
let recognition;
let currentChatId = generateChatId();
let isCodeMentorMode = false;
let chatSessions = loadChatHistory();
let chatToDelete = null;
let chatToEdit = null;

// --- INITIAL SETUP ---
initializeChatSession();

// --- EVENT LISTENERS ---
inputForm.addEventListener('submit', handleSendMessage);
voiceButton.addEventListener('click', toggleVoiceRecording);
cancelVoiceBtn.addEventListener('click', stopRecording);
historyBtn.addEventListener('click', toggleChatHistory);
closeHistory.addEventListener('click', closeHistorySidebar);
newChatBtn.addEventListener('click', startNewChat);
newChatHeaderBtn.addEventListener('click', startNewChat);
mentorMode.addEventListener('change', toggleMentorMode);
featuresBtn.addEventListener('click', showFeatures);
closeTour.addEventListener('click', hideFeatures);
confirmDeleteBtn.addEventListener('click', confirmDeleteChat);
cancelDeleteBtn.addEventListener('click', hideDeleteModal);
saveTitleBtn.addEventListener('click', saveChatTitle);
cancelEditBtn.addEventListener('click', hideEditModal);
overlay.addEventListener('click', closeAllModals);
floatingPremium.addEventListener('click', showFeatures);

// --- CORE FUNCTIONS ---
function initializeChatSession() {
    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat) {
        const welcomeMessage = isCodeMentorMode ? 
            "Code Debugger mode is active. Please provide the code you need help with." : 
            "Hello! I'm your DSA Mentor. How can I help you with data structures and algorithms today?";
        displayMessage(welcomeMessage, isCodeMentorMode ? 'code-mentor' : 'bot');
        saveToHistory('', welcomeMessage, true);
    } else {
        loadChat(currentChatId);
    }
}

async function handleSendMessage(event) {
    event.preventDefault();
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    displayMessage(userMessage, 'user');
    messageInput.value = '';
    sendButton.disabled = true;

    const typingIndicator = createTypingIndicator();
    try {
        const botResponse = await getBotResponse(userMessage);
        chatBox.removeChild(typingIndicator);
        const messageType = isCodeMentorMode ? 'code-mentor' : 'bot';
        displayMessage(botResponse, messageType);
        saveToHistory(userMessage, botResponse);
    } catch (error) {
        chatBox.removeChild(typingIndicator);
        displayMessage(`Error: ${error.message}`, 'error');
    }
    sendButton.disabled = false;
    messageInput.focus();
}

function toggleMentorMode() {
    isCodeMentorMode = mentorMode.checked;
    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (currentChat) {
        currentChat.isCodeMentor = isCodeMentorMode;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(chatSessions));
        renderChatHistory();
    }
    if (isCodeMentorMode) {
        displayMessage("Code Debugger mode activated. Paste your code for analysis.", 'code-mentor');
    } else {
        displayMessage("Switched to DSA Mentor mode. Feel free to ask any conceptual questions.", 'bot');
    }
}

// --- UI & DISPLAY FUNCTIONS ---

function displayMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    // Basic Markdown to HTML parsing (UI tweaks: nice code, colors, icons if wanted)
    let html = text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang.trim() || 'plaintext';
            return `</p></div><div class="code-block">
                        <div class="code-header">
                            <span class="code-language"><i class="fas fa-code"></i> ${language}</span>
                            <button class="copy-code-btn" title="Copy code"><i class="fas fa-copy"></i></button>
                        </div>
                        <pre><code class="language-${language}">${code.trim()}</code></pre>
                    </div><div><p>`;
        })
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/<\/ol>\s*<ol>/g, '')
        .replace(/\n/g, '<br>');

    messageElement.innerHTML = `<div><p>${html}</p></div>`;

    chatBox.appendChild(messageElement);

    // Code copy button
    messageElement.querySelectorAll('.copy-code-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.closest('.code-block').querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                btn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
    });

    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElement;
}

function createTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.classList.add('message', isCodeMentorMode ? 'code-mentor-message' : 'bot-message', 'typing-indicator');
    typingElement.innerHTML = `<span></span><span></span><span></span>`;
    chatBox.appendChild(typingElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingElement;
}

function toggleChatHistory() {
    chatHistory.classList.add('active');
    overlay.classList.add('active');
}
function closeHistorySidebar() {
    chatHistory.classList.remove('active');
    overlay.classList.remove('active');
}
function showFeatures() {
    featureTour.classList.add('active');
    overlay.classList.add('active');
}
function hideFeatures() {
    featureTour.classList.remove('active');
    overlay.classList.remove('active');
}
function closeAllModals() {
    chatHistory.classList.remove('active');
    featureTour.classList.remove('active');
    deleteConfirmModal.classList.remove('active');
    editTitleModal.classList.remove('active');
    overlay.classList.remove('active');
}

// --- CHAT HISTORY MANAGEMENT ---

function saveToHistory(userMessage, botResponse, isWelcomeMessage = false) {
    let currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat) {
        currentChat = {
            id: currentChatId,
            title: isWelcomeMessage ? 'New Chat' : (userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '')),
            messages: [],
            timestamp: new Date().toISOString(),
            isCodeMentor: isCodeMentorMode
        };
        chatSessions.unshift(currentChat);
        if (chatSessions.length > MAX_HISTORY_ITEMS) {
            chatSessions.pop();
        }
    }
    if (isWelcomeMessage && currentChat.messages.length === 0) {
        currentChat.messages.push({ user: '', bot: botResponse, timestamp: new Date().toISOString() });
    } 
    else if (!isWelcomeMessage) {
        currentChat.messages.push({ user: userMessage, bot: botResponse, timestamp: new Date().toISOString() });
        if (currentChat.title === 'New Chat') {
            currentChat.title = userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '');
        }
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(chatSessions));
    renderChatHistory();
}

function startNewChat() {
    currentChatId = generateChatId();
    chatBox.innerHTML = '';
    history = [];
    const welcomeMessage = isCodeMentorMode ? 
        "Code Debugger mode is active. Please provide the code you need help with." :
        "Hello! I'm your DSA Mentor. How can I help you with data structures and algorithms today?";
    displayMessage(welcomeMessage, isCodeMentorMode ? 'code-mentor' : 'bot');
    saveToHistory('', welcomeMessage, true);
    closeHistorySidebar();
}
function loadChat(chatId) {
    const chat = chatSessions.find(c => c.id === chatId);
    if (!chat) return;
    currentChatId = chatId;
    chatBox.innerHTML = '';
    history = [];
    isCodeMentorMode = chat.isCodeMentor;
    mentorMode.checked = isCodeMentorMode;
    chat.messages.forEach(msg => {
        if (msg.user) {
            displayMessage(msg.user, 'user');
            history.push({ role: 'user', parts: [{ text: msg.user }] });
        }
        if (msg.bot) {
            const messageType = chat.isCodeMentor ? 'code-mentor' : 'bot';
            displayMessage(msg.bot, messageType);
            history.push({ role: 'model', parts: [{ text: msg.bot }] });
        }
    });
    renderChatHistory();
}
function renderChatHistory() {
    historyList.innerHTML = '';
    if (chatSessions.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No chat history yet</p>';
        return;
    }
    chatSessions.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.className = 'history-item';
        if (chat.id === currentChatId) chatElement.classList.add('active');
        chatElement.innerHTML = `
            <div class="history-actions">
                <button class="history-action-btn edit-chat" title="Edit title"><i class="fas fa-edit"></i></button>
                <button class="history-action-btn delete-chat" title="Delete chat"><i class="fas fa-trash"></i></button>
            </div>
            <div class="history-preview">${chat.title}</div>
            <div class="history-date">${formatDate(chat.timestamp)} • ${chat.isCodeMentor ? 'Debugger' : 'DSA Mentor'}</div>`;
        chatElement.addEventListener('click', (e) => {
            if (!e.target.closest('.history-actions')) {
                loadChat(chat.id);
                closeHistorySidebar();
            }
        });
        chatElement.querySelector('.edit-chat').addEventListener('click', (e) => { e.stopPropagation(); showEditModal(chat.id); });
        chatElement.querySelector('.delete-chat').addEventListener('click', (e) => { e.stopPropagation(); showDeleteModal(chat.id); });
        historyList.appendChild(chatElement);
    });
}

// --- API, VOICE & UTILITIES (No major changes needed from here) ---

async function getBotResponse(userMessage) {
    history.push({ role: 'user', parts: [{ text: userMessage }] });
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
    const requestBody = {
        contents: history,
        systemInstruction: {
            parts: [{ 
                text: isCodeMentorMode ? codeMentorInstruction : dsaMentorInstruction 
            }]
        },
        generationConfig: {
            temperature: isCodeMentorMode ? 0.2 : 0.7,
            maxOutputTokens: 4096,
        },
        safetySettings: [
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error("API Error Response:", responseData);
        const errorMsg = responseData.error?.message || "An error occurred with the API.";
        throw new Error(errorMsg);
    }
    let botResponseText = "Sorry, I couldn't generate a response. Please try again.";
    if (responseData.candidates && responseData.candidates[0].content) {
        botResponseText = responseData.candidates[0].content.parts[0].text;
    } else if (responseData.promptFeedback) {
        botResponseText = `I can't respond to that. Blocked for reason: ${responseData.promptFeedback.blockReason}`;
    }
    history.push({ role: 'model', parts: [{ text: botResponseText }] });
    return botResponseText;
}

// Modal utilities
function showDeleteModal(chatId) {
    chatToDelete = chatId;
    deleteConfirmModal.classList.add('active');
    overlay.classList.add('active');
}
function hideDeleteModal() {
    deleteConfirmModal.classList.remove('active');
    overlay.classList.remove('active');
    chatToDelete = null;
}
function showEditModal(chatId) {
    chatToEdit = chatId;
    const chat = chatSessions.find(c => c.id === chatId);
    if (chat) newChatTitleInput.value = chat.title;
    editTitleModal.classList.add('active');
    overlay.classList.add('active');
}
function hideEditModal() {
    editTitleModal.classList.remove('active');
    overlay.classList.remove('active');
    chatToEdit = null;
}
function confirmDeleteChat() {
    if (chatToDelete) {
        chatSessions = chatSessions.filter(chat => chat.id !== chatToDelete);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(chatSessions));
        if (chatToDelete === currentChatId) startNewChat();
        renderChatHistory();
    }
    hideDeleteModal();
}
function saveChatTitle() {
    if (chatToEdit && newChatTitleInput.value.trim()) {
        const chat = chatSessions.find(c => c.id === chatToEdit);
        if (chat) {
            chat.title = newChatTitleInput.value.trim();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(chatSessions));
            renderChatHistory();
        }
    }
    hideEditModal();
}

function generateChatId() { return 'chat-' + Date.now(); }
function loadChatHistory() { const history = localStorage.getItem(HISTORY_KEY); return history ? JSON.parse(history) : []; }
function formatDate(isoString) { const date = new Date(isoString); return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); }

function toggleVoiceRecording() { isRecording ? stopRecording() : startRecording(); }
function startRecording() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { displayMessage("Voice feature not supported", 'error'); return; }
    isRecording = true;
    voiceButton.classList.add('listening');
    voiceUI.classList.add('active');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
            messageInput.value = transcript;
            stopRecording();
            inputForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    };
    recognition.onerror = (event) => { console.error("Recognition error:", event.error); displayMessage(`Voice error: ${event.error}`, 'error'); stopRecording(); };
    recognition.start();
}
function stopRecording() {
    isRecording = false;
    voiceButton.classList.remove('listening');
    voiceUI.classList.remove('active');
    if (recognition) recognition.stop();
}
});