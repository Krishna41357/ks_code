const express = require("express");
const app = express();
const http = require("http");
const {Server} = require("socket.io");
const cors = require("cors");
app.use(cors);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server);
  

const PORT = process.env.PORT || 5000;

const userSocketMap = {}   // making this to match a single socket id with a single username so that 1 person remains in 1 room at a time only
const getAllConnectedClients = (roomId)=>{
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId)=>{
            return{
                socketId,
                username:userSocketMap[socketId],
            };
        }
    ) // getting the room of roomId passed type : map
}
io.on("connection",(socket)=>{
    console.log(`User connected: ${socket.id}`);

    socket.on('join', ({roomId,username})=>{
        userSocketMap[socket.id ] = username; // here socket id is the key and value is username hence the object is defined in a key value pair
        socket.join(roomId); // socket will make the ursername join the roomId that exists pehele se hi but if no roomId is there
        // so socket will make another room for this username if the roomId doesnt exits
        const clients = getAllConnectedClients(roomId);
        //notify all users that new user is joined
        clients.forEach(({socketId})=>{
            io.to(socketId).emit('joined',({clients,username,socketId:socket.id}))
        })
    })
    socket.on('code-change',({roomId,code})=>{
        socket.in(roomId).emit("code-change",{code});
    });
     socket.on('sync-code',({socketId , code})=>{
         io.to(socketId).emit("code-change",{code}); // so that new user gets the code runing in the room
    })//io.to is used bcoz user himself has to see the change
    socket.on('disconnecting',()=>{ //  bbroadcasting the disconnected user
        const rooms = [...socket.rooms]
        rooms.forEach((roomId)=>{
            socket.in(roomId).emit('disconnected',{socketId:socket.id,username:userSocketMap[socket.id]})
        })
    })
    delete userSocketMap[socket.id];
    socket.leave();
})


server.listen(PORT, ()=>{
    console.log("server is running")
})
