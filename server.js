const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve static files
app.use(express.static('public'));

// Socket.IO logic (only used in development)
if (process.env.NODE_ENV !== 'production') {
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

        socket.on('send-message', (data) => {
            if (socket.partner) {
                socket.partner.emit('receive-message', {
                    message: data.message,
                    nickname: socket.nickname
                });
            }
        });

        socket.on('typing', (isTyping) => {
            if (socket.partner) {
                socket.partner.emit('partner-typing', isTyping);
            }
        });

        socket.on('leave-chat', () => {
            if (socket.partner) {
                socket.partner.emit('partner-left');
                socket.partner.partner = null;
                socket.partner = null;
            }
            const index = waitingUsers.indexOf(socket);
            if (index > -1) {
                waitingUsers.splice(index, 1);
            }
        });

        socket.on('disconnect', () => {
            totalUsers--;
            io.emit('user-count', totalUsers);
            if (socket.partner) {
                socket.partner.emit('partner-left');
                socket.partner.partner = null;
            }
            const index = waitingUsers.indexOf(socket);
            if (index > -1) {
                waitingUsers.splice(index, 1);
            }
        });

        socket.on('next-chat', () => {
            if (socket.partner) {
                socket.partner.emit('partner-left');
                socket.partner.partner = null;
                socket.partner = null;
            }
            socket.emit('join', { nickname: socket.nickname });
        });
    });
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 