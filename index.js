// Import required modules
const express = require('express');
const app = express();
const http = require('http');
const { userInfo } = require('os');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

// Set up server to listen on port 3000
server.listen(3000, () => {
    console.log('listening on *:3000');
});

// Serve the index.html file when the user navigates to the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Set up variables to keep track of votes and users who have voted
const votedUsers = new Set();
let votes = 0;

// Set up socket.io connection and define event handlers
io.on('connection', (socket) => {

    // Calculate the threshold number of votes needed to reset the canvas
    const threshold = Math.floor((io.engine.clientsCount / 2) + 1);

    // Calculate the number of players currently online
    const players = Math.ceil((io.engine.clientsCount));

    // Emit the number of players online to all sockets
    io.emit(`playersOnline`, players)

    // Emit the threshold number of votes to all sockets
    io.emit('votes threshold', threshold);

    // Assign username to socket ID
    socket.on('set username', (username) => {
        socket.username = username;

        // Emit a message indicating that the user has joined the chat
        io.emit('chat message', `${socket.username} joined`);
    });

    // Handle chat messages sent by the user
    socket.on('chat message', (msg) => {

        // Send message with username to all sockets
        io.emit('chat message', `${socket.username}: ${msg}`);
    });

    // Handle disconnection events
    socket.on('disconnect', () => {

        // Recalculate the threshold number of votes needed to reset the canvas
        const threshold = Math.floor((io.engine.clientsCount / 2) + 1);

        // Emit the new threshold number to all sockets
        io.emit('votes threshold', threshold)

        // Calculate the number of players currently online
        const players = Math.floor(io.engine.clientsCount);

        // Emit the number of players online to all sockets
        io.emit(`playersOnline`, players)

        // send a message that a user disconnected and If the user had previously voted, remove their vote and emit a message to update the vote count 
        io.emit('chat message', `${socket.username} disconnected`);
        if (votedUsers.has(socket.id)) {
            votedUsers.delete(socket.id);
            if (votes > 0) {
                votes--;
            }

            io.emit('votes', votes);
        }
    });

    // io.emit sends a function and data back to all clients

    // Emit the current vote count to the newly connected user
    socket.emit('votes', votes);

    // When a user votes to reset the canvas, update the vote count and notify all connected users
    socket.on('vote', () => {
        if (io.engine.clientsCount == 1) {

            // If the only user connected is the one who voted, reset the canvas immediately
            io.emit('resetCanvas');
            return;
        }
        if (votedUsers.has(socket.id)) {

            // If the user had already voted, remove their vote and notify all connected users
            votedUsers.delete(socket.id);
            if (votes > 0) {
                if (votes <= threshold) {

                    votes--;
                    io.emit('chat message', `${socket.username} removed their vote`)
                }
            }
        } else {

            // If the user has not voted yet, add their vote and notify all connected users
            io.emit('chat message', `${socket.username} voted to reset the canvas`)
            votedUsers.add(socket.id);
            votes++; // Increment votes
        }
        console.log(`Votes: ${votes}/${io.engine.clientsCount}`);
        io.emit('votes', votes);
        if (votes >= threshold) {

            // If the vote count reaches the threshold, reset the canvas and notify all connected users
            votes = 0;
            io.emit('resetCanvas');
            votedUsers.clear()
            io.emit('chat message', `The canvas has been reset!`)
        }
    });

    // When a user sends coordinate data, emit it to all connected sockets
    io.on("coord", (data) => {
        io.emit("coordStart", data)
    })

    // When a user draws on the canvas, emit the drawing data to all connected sockets
    socket.on("draw", (data) => {
        io.emit("draw", data)
    })

    // When a user sends a drawing width, emit it to all connected sockets
    socket.on("sendDrawWidth", width => {
        io.emit("sendDrawWidth", width)
    })

    // When a user sends a color, emit it to all connected sockets
    socket.on("sendColor", color => {
        io.emit("sendColor", color)
    })

    // When a user ends their drawing, emit the end coordinate data to all connected sockets
    socket.on("coordEnd", coord => {
        io.emit("coordEnd", coord)
    })

});

