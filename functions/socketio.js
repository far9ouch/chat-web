const { Server } = require('socket.io');
const express = require('express');
const serverless = require('serverless-http');
const { users, waitingUsers, addUser, removeUser } = require('./utils');

exports.handler = async (event, context) => {
    const app = express();
    const server = require('http').createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    let totalUsers = 0;

    io.on('connection', (socket) => {
        console.log('A user connected');
        totalUsers++;
        io.emit('user-count', totalUsers);

        socket.on('join', (data) => {
            socket.nickname = data.nickname || 'Anonymous';
            addUser(socket, socket.nickname);
            
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
            removeUser(socket.id);
        });

        socket.on('disconnect', () => {
            totalUsers--;
            io.emit('user-count', totalUsers);
            if (socket.partner) {
                socket.partner.emit('partner-left');
                socket.partner.partner = null;
            }
            removeUser(socket.id);
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

    const handler = serverless(app);
    return handler(event, context);
};

module.exports.io = io; 