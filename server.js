const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

app.use(express.static(path.join(__dirname, 'public')));

let rooms = ['General', 'Tech', 'Games']; // Salas pré-criadas
let users = {}; 

// Quando um cliente se conecta
io.on('connection', (socket) => {
    console.log("Conexão detectada...");

    // Quando o usuário entra com seu nome
    socket.on('join-request', (username) => {
        socket.username = username;
        users[socket.id] = { username, room: null }; // Adiciona o usuário ao objeto users
        console.log(`${username} se conectou`);
        socket.emit('user-ok', rooms); // Envia as salas pré-criadas para este usuário
    });

    // Quando um usuário entra em uma sala
    socket.on('join-room', (room) => {
        if (!rooms.includes(room)) {
            rooms.push(room); // Adiciona a nova sala à lista
            io.emit('room-list-update', rooms); // Atualiza a lista de salas para todos os clientes
        }

        socket.join(room); // O usuário entra na sala
        users[socket.id].room = room;

        io.to(room).emit('list-update', {
            joined: socket.username,
            list: getUsersInRoom(room)
        });

        socket.emit('status', `Você entrou na sala: ${room}`);
    });

    // Envio de mensagens
    socket.on('send-msg', (message, room) => {
        // Emitir para todos, exceto o remetente
        socket.to(room).emit('show-msg', {
            username: socket.username,
            message: message,
            room: room
        });
    });

    // Quando o usuário sai de uma sala
    socket.on('leave-room', (room) => {
        socket.leave(room);
        users[socket.id].room = null;

        io.to(room).emit('list-update', {
            left: socket.username,
            list: getUsersInRoom(room)
        });
    });

    // Quando o usuário desconecta
    socket.on('disconnect', () => {
        if (users[socket.id].room) {
            let room = users[socket.id].room;
            io.to(room).emit('list-update', {
                left: socket.username,
                list: getUsersInRoom(room)
            });
        }
        console.log(`${socket.username} desconectado`);
        delete users[socket.id];
    });
});

// Função para pegar os usuários de uma sala
function getUsersInRoom(room) {
    return Object.values(users)
        .filter(user => user.room === room)
        .map(user => user.username);
}
