require('dotenv').config();
const express = require('express');
const app = express();
http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const leaveRoom = require('./utils/leave-room');

app.use(cors()); // Add cors middleware

const server = http.createServer(app); 

app.get('/', (req, res) => {
  res.send('Hello world');
});

// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const CHAT_BOT = 'ChatBot'; 

let chatRoom = ''; // E.g. javascript, node,...
let allUsers = []; // All users in current chat room

// Listen for when the client connects via socket.io-client
io.on('connection', (socket) => {
  console.log(`User connected ${socket.id}`);

  // We can write our socket event listeners in here...
  // Add a user to a room
  socket.on('join_room', (data) => {
    const { username, room } = data; // Data sent from client when join_room event emitted
    socket.join(room); // Join the user to a socket room

    let __createdtime__ = Date.now(); // Current timestamp   const
    // Send message to all users currently in the room, apart from the user that just joined
    socket.to(room).emit('receive_message', {
      message: `${username} has joined the chat room`,
      username: CHAT_BOT,
      __createdtime__,
    });

    // Send welcome msg to user that just joined chat only
    socket.emit('receive_message', {
      message: `Welcome ${username}`,
      username: CHAT_BOT,
      __createdtime__,
    });    

    // Save the new user to the room
    chatRoom = room;

    allUsers.push({ id: socket.id, username, room });
    const chatRoomUsers = allUsers.filter((user) => user.room === room);
    socket.to(room).emit('chatroom_users', chatRoomUsers);
    socket.emit('chatroom_users', chatRoomUsers);
  });

  socket.on('send_message', (data) => {
    const { username, room, message, __createdtime__ } = data;
    io.in(room).emit('receive_message', { username, message, __createdtime__ });
  });

  socket.on('leave_room', (data) => {
    const { username, room } = data;
    socket.leave(room);
    const __createdtime__ = Date.now();
    // Remove user from memory
    allUsers = leaveRoom(socket.id, allUsers);
    socket.to(room).emit('chatroom_users', allUsers);
    socket.to(room).emit('receive_message', {
      username: CHAT_BOT,
      message: `${username} has left the chat`,
      __createdtime__,
    });
    console.log(`${username} has left the chat`);
  });
  
  socket.on('disconnect', () => {
    // console.log('User disconnected from the chat');
    // const user = allUsers.find((user) => user.id == socket.id);
    // if (user?.username) {
    //   allUsers = leaveRoom(socket.id, allUsers);
    //   socket.to(chatRoom).emit('chatroom_users', allUsers);
    //   socket.to(chatRoom).emit('receive_message', {
    //     message: `${user.username} has disconnected from the chat.`,
    const user = allUsers.find((user) => user.id === socket.id);
    if (user) {
      allUsers = leaveRoom(socket.id, allUsers);
      socket.to(user.room).emit('chatroom_users', allUsers);
      socket.to(user.room).emit('receive_message', {
        message: `${user.username} has disconnected from the chat.`,
        username: 'ChatBot',
        __createdtime__: Date.now(),
      });
    }
  });
});

server.listen(4000, () => 'Server is running on port 4000');

// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// app.use(cors());

// const PORT = process.env.PORT || 5001; // ポート番号を5001に変更


// let messages = []; // メモリ内でメッセージを保持

// io.on('connection', (socket) => {
//   console.log('New client connected');

//   // 接続時にすべてのメッセージを送信
//   socket.emit('load_messages', messages);

//   // メッセージを受信してブロードキャスト
//   socket.on('send_message', (data) => {
//     const message = { username: data.username, message: data.message, __createdtime__: new Date() };
//     messages.push(message);
//     console.log('Message received:', data);
//     io.emit('receive_message', data);
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
