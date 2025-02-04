const users = new Map();
const waitingUsers = [];

function addUser(socket, nickname) {
    users.set(socket.id, {
        socket,
        nickname,
        partner: null
    });
}

function removeUser(socketId) {
    const user = users.get(socketId);
    if (user) {
        const partnerSocket = user.partner;
        if (partnerSocket) {
            const partner = users.get(partnerSocket.id);
            if (partner) {
                partner.partner = null;
            }
        }
        users.delete(socketId);
    }
    const waitingIndex = waitingUsers.findIndex(s => s.id === socketId);
    if (waitingIndex !== -1) {
        waitingUsers.splice(waitingIndex, 1);
    }
}

module.exports = {
    users,
    waitingUsers,
    addUser,
    removeUser
}; 