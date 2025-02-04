const socket = io({
    path: '/.netlify/functions/socketio',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});
let typingTimeout = null;

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const chatContainer = document.getElementById('chat-container');
const startButton = document.getElementById('start-chat');
const leaveButton = document.getElementById('leave-chat');
const status = document.getElementById('status');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const nextButton = document.getElementById('next-button');
const userCountSpan = document.getElementById('user-count');
const nicknameInput = document.getElementById('nickname');

// Sound effects
const messageSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3');
const connectSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');

// Initialize
let nickname = '';

// Event Listeners
startButton.addEventListener('click', startChat);
leaveButton.addEventListener('click', leaveChat);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', handleKeyPress);
nextButton.addEventListener('click', findNewPartner);

function startChat() {
    nickname = nicknameInput.value.trim() || 'Anonymous';
    welcomeScreen.style.display = 'none';
    chatContainer.style.display = 'block';
    socket.emit('join', { nickname });
    messageInput.focus();
}

function leaveChat() {
    socket.emit('leave-chat');
    chatContainer.style.display = 'none';
    welcomeScreen.style.display = 'block';
    chatMessages.innerHTML = '';
    nicknameInput.value = '';
}

function findNewPartner() {
    chatMessages.innerHTML = '';
    status.textContent = 'Looking for someone to chat with...';
    socket.emit('next-chat');
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Typing indicator
messageInput.addEventListener('input', () => {
    if (typingTimeout) clearTimeout(typingTimeout);
    
    socket.emit('typing', true);
    
    typingTimeout = setTimeout(() => {
        socket.emit('typing', false);
    }, 1000);
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        appendMessage(message, 'sent');
        socket.emit('send-message', { message, nickname });
        messageInput.value = '';
        socket.emit('typing', false);
        vibrate();
    }
}

function appendMessage(message, type, senderNickname = '') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const nickname = type === 'received' && senderNickname ? `<div class="nickname">${senderNickname}</div>` : '';
    
    messageElement.innerHTML = `
        ${nickname}
        <div class="message-content">${message}</div>
        <div class="message-timestamp">${timestamp}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Socket event handlers
socket.on('waiting', () => {
    status.textContent = 'Looking for someone to chat with...';
});

socket.on('chat-start', (data) => {
    status.textContent = `Connected with ${data.partnerNickname || 'Anonymous'}!`;
    connectSound.play();
});

socket.on('receive-message', (data) => {
    appendMessage(data.message, 'received', data.nickname);
    messageSound.play();
});

socket.on('partner-left', () => {
    status.textContent = 'Your chat partner has disconnected.';
    appendMessage('Your chat partner has disconnected.', 'system');
});

socket.on('partner-typing', (isTyping) => {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.textContent = isTyping ? 'Partner is typing...' : '';
});

socket.on('user-count', (count) => {
    userCountSpan.textContent = count;
});

// Add these functions at the beginning
function preventZoom(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}

document.addEventListener('touchstart', preventZoom, { passive: false });

// Add vibration feedback
function vibrate(duration = 50) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Add sound loading with fallback
function loadSound(url) {
    const audio = new Audio();
    audio.src = url;
    audio.load();
    return {
        play: () => {
            if (!document.hidden) {
                audio.play().catch(() => {});
            }
        }
    };
}

// Update sound effects
const messageSound = loadSound('https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3');
const connectSound = loadSound('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');

// Add orientation change handling
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.style.height = window.innerHeight + 'px';
    }, 200);
});

// Improve typing indicator
function updateTypingIndicator(isTyping) {
    const typingIndicator = document.getElementById('typing-indicator');
    if (isTyping) {
        typingIndicator.style.display = 'flex';
    } else {
        typingIndicator.style.display = 'none';
    }
}

socket.on('partner-typing', updateTypingIndicator);

// Add mobile swipe for next chat
let touchStartX = 0;
let touchEndX = 0;

chatContainer.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

chatContainer.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 100;
    if (touchEndX - touchStartX > swipeThreshold) {
        // Swipe right - find new partner
        findNewPartner();
        vibrate(100);
    }
}

// Add connection status handling
socket.on('connect', () => {
    console.log('Connected to server');
    document.body.classList.remove('disconnected');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    document.body.classList.add('disconnected');
    status.textContent = 'Disconnected from server. Trying to reconnect...';
});

socket.on('connect_error', (error) => {
    console.log('Connection error:', error);
    status.textContent = 'Connection error. Trying to reconnect...';
}); 