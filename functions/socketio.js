const { Server } = require('socket.io');
const express = require('express');
const serverless = require('serverless-http');

const app = express();
const server = app.listen(0);
const io = new Server(server);

const waitingUsers = [];
let totalUsers = 0;

io.on('connection', (socket) => {
    console.log('A user connected');
    totalUsers++;
    io.emit('user-count', totalUsers);

    socket.on('join', (data) => {
        socket.nickname = data.nickname || 'Anonymous';
        
        if (waitingUsers.length > 0) {
            const partner = waitingUsers.pop();
            socket.partner = partner;
            partner.partner = socket;
            
            socket.emit('chat-start', { partnerNickname: partner.nickname });
            partner.emit('chat-start', { partnerNickname: socket.nickname });
        } else {
            waitingUsers.push(socket);
            socket.emit('waiting');
        }
    });

    // ... rest of your socket.io event handlers ...
});

const handler = serverless(app);
module.exports = { handler }; 