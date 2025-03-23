const express = require("express");
const app = express();
const http = require("http");
const {Server} = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;

const userSocketMap = {}   // making this to match a single socket id with a single username so that 1 person remains in 1 room at a time only
io.on("connection",(socket)=>{
    console.log(`User connected: ${socket.id}`);

    socket.on('join', ({roomId,username})=>{
        userSocketMap[socket.id ] = username; // here socket id is the key and value is username hence the object is defined in a key value pair
        socket.join(roomId) // socket will make the ursername join the roomId that exists pehele se hi but if no roomId is there
        // so socket will make another room for this username if the roomId doesnt exits
    })
})
server.listen(PORT, ()=>{
    console.log("server is running")
})