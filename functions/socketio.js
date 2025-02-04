const { Server } = require('socket.io');
const express = require('express');
const serverless = require('serverless-http');

const app = express();
const server = require('http').createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling']
    },
    path: '/.netlify/functions/socketio'
});

// Keep track of users and rooms
const users = new Map();
const waitingUsers = [];
let totalUsers = 0;

exports.handler = async (event, context) => {
    // Handle WebSocket connections
    if (event.requestContext.eventType === 'CONNECT') {
        console.log('Client connected');
        totalUsers++;
        io.emit('user-count', totalUsers);
        return { statusCode: 200, body: 'Connected' };
    }

    if (event.requestContext.eventType === 'DISCONNECT') {
        console.log('Client disconnected');
        totalUsers--;
        io.emit('user-count', totalUsers);
        return { statusCode: 200, body: 'Disconnected' };
    }

    if (event.requestContext.eventType === 'MESSAGE') {
        const data = JSON.parse(event.body);
        handleSocketEvent(data);
        return { statusCode: 200, body: 'Message received' };
    }

    // Handle HTTP requests
    const handler = serverless(app);
    return handler(event, context);
};

function handleSocketEvent(data) {
    switch (data.type) {
        case 'join':
            handleJoin(data);
            break;
        case 'message':
            handleMessage(data);
            break;
        case 'typing':
            handleTyping(data);
            break;
        case 'leave':
            handleLeave(data);
            break;
    }
}

function handleJoin(data) {
    const { socketId, nickname } = data;
    if (waitingUsers.length > 0) {
        const partner = waitingUsers.pop();
        users.set(socketId, { partner: partner.id, nickname });
        users.set(partner.id, { partner: socketId, nickname: partner.nickname });
        
        io.to(socketId).emit('chat-start', { partnerNickname: partner.nickname });
        io.to(partner.id).emit('chat-start', { partnerNickname: nickname });
    } else {
        waitingUsers.push({ id: socketId, nickname });
        io.to(socketId).emit('waiting');
    }
}

function handleMessage(data) {
    const { socketId, message } = data;
    const user = users.get(socketId);
    if (user && user.partner) {
        io.to(user.partner).emit('receive-message', {
            message,
            nickname: user.nickname
        });
    }
}

function handleTyping(data) {
    const { socketId, isTyping } = data;
    const user = users.get(socketId);
    if (user && user.partner) {
        io.to(user.partner).emit('partner-typing', isTyping);
    }
}

function handleLeave(data) {
    const { socketId } = data;
    const user = users.get(socketId);
    if (user && user.partner) {
        io.to(user.partner).emit('partner-left');
        users.delete(user.partner);
    }
    users.delete(socketId);
    const index = waitingUsers.findIndex(u => u.id === socketId);
    if (index > -1) {
        waitingUsers.splice(index, 1);
    }
}

module.exports.io = io; 