const socket = io();
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