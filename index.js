const express = require('express');
const app = express();
const http = require('http');
const { userInfo } = require('os');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { deflateRaw } = require('zlib');
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/draw.html');
});

io.on('connection', (socket) => {
    // Assign username to socket ID
    socket.on('set username', (username) => {
        socket.username = username;
        io.emit('chat message', `${socket.username} joined`);
    });

    socket.on('chat message', (msg) => {
        // Send message with username
        io.emit('chat message', `${socket.username}: ${msg}`);
    });

    socket.on('disconnect', () => {
        io.emit('chat message', `${socket.username} disconnected`);
    });
});

io.on('connection', (socket) => {





    io.on("coord", (data) => {
        io.emit("coordStart", data)
    })
    socket.on("draw", (data) => {
        io.emit("draw", data)

    })

    socket.on("sendDrawWidth", width => {
        io.emit("sendDrawWidth", width)
    })

    socket.on("sendColor", color => {
        io.emit("sendColor", color)
    })

    socket.on("coordEnd", coord => {
        io.emit("coordEnd", coord)
    })

});

io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets

io.of("/orders").on("connection", (socket) => {
    socket.on("order:list", () => { });
    socket.on("order:create", () => { });
});

io.of("/users").on("connection", (socket) => {
    socket.on("user:list", () => { });
});