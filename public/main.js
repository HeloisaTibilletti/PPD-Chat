const socket = io();

let username = '';
let currentRoom = '';
let userList = [];

let loginPage = document.querySelector('#loginPage');
let roomSelectionPage = document.querySelector('#roomSelectionPage');
let chatPage = document.querySelector('#chatPage');
let loginInput = document.querySelector('#loginNameInput');
let textInput = document.querySelector('#chatTextInput');
let roomList = document.querySelector('#roomList');
let currentRoomLabel = document.querySelector('#currentRoom');
let leaveRoomBtn = document.querySelector('#leaveRoomBtn');
let newRoomInput = document.querySelector('#newRoomInput');
let createRoomBtn = document.querySelector('#createRoomBtn');

loginPage.style.display = 'flex';
roomSelectionPage.style.display = 'none';
chatPage.style.display = 'none';

function renderRoomList(rooms) {
    roomList.innerHTML = ''; // Limpa a lista de salas
    rooms.forEach(room => {
        let li = document.createElement('li');
        li.textContent = room;
        li.addEventListener('click', () => {
            joinRoom(room); // Ao clicar, entra na sala
        });
        roomList.appendChild(li);
    });
}

function renderUserList() {
    let ul = document.querySelector('.userList');
    ul.innerHTML = '';
    userList.forEach(i => {
        let li = document.createElement('li');
        li.textContent = i;
        ul.appendChild(li);
    });
}

function addMessage(type, user, msg) {
    let ul = document.querySelector('.chatList');

    switch (type) {
        case 'status':
            ul.innerHTML += '<li class="m-status">' + msg + '</li>';
            break;
        case 'msg':
            if (username == user) {
                ul.innerHTML += '<li class="m-txt"><span class="me">' + user + '</span> ' + msg + '</li>';
            } else {
                ul.innerHTML += '<li class="m-txt"><span>' + user + '</span> ' + msg + '</li>';
            }
            break;
    }

    ul.scrollTop = ul.scrollHeight;
}

loginInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        let name = loginInput.value.trim();
        if (name != '') {
            username = name;
            document.title = 'Chat (' + username + ')';
            socket.emit('join-request', username); // Envia o nome para o servidor
        }
    }
});

textInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        let txt = textInput.value.trim();
        textInput.value = '';

        if (txt != '') {
            addMessage('msg', username, txt);
            socket.emit('send-msg', txt, currentRoom);
        }
    }
});

createRoomBtn.addEventListener('click', () => {
    let newRoom = newRoomInput.value.trim();
    if (newRoom !== '') {
        socket.emit('join-room', newRoom); // Criar nova sala ao clicar
        newRoomInput.value = ''; 
    }
});

leaveRoomBtn.addEventListener('click', () => {
    socket.emit('leave-room', currentRoom);
    currentRoom = '';
    chatPage.style.display = 'none';
    roomSelectionPage.style.display = 'flex';
});

socket.on('user-ok', (rooms) => {
    loginPage.style.display = 'none';
    roomSelectionPage.style.display = 'flex';
    renderRoomList(rooms); // Exibe as salas no frontend
});

function joinRoom(room) {
    currentRoom = room;
    socket.emit('join-room', room); // Entra na sala

    currentRoomLabel.textContent = room;
    roomSelectionPage.style.display = 'none';
    chatPage.style.display = 'flex';

    addMessage('status', null, 'Entrou na sala: ' + room);
}

socket.on('list-update', (data) => {
    userList = data.list;
    renderUserList(); // Atualiza a lista de usuários na sala
});

socket.on('show-msg', (data) => {
    if (data.room === currentRoom) {
        addMessage('msg', data.username, data.message);
    }
});

socket.on('room-list-update', (rooms) => {
    renderRoomList(rooms); // Atualiza a lista de salas quando uma nova sala é criada
});
