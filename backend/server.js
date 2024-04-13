const app = require('express')();
const api = require('./godfather_api_interface')
const axios = require("axios");
let godfatherSecretKey = "ds54fs56d4fx53dfxd";
let baseUrl = "https://godfathergame.ir/api/v1/games"
let server = {};

server = require('http').createServer(app);
log('Using http.');


const io = require('socket.io')(server, { cors: true, origins: false });
const signalServer = require('simple-signal-server')(io)
const port = process.env.PORT || 3000;
const rooms = new Map()

server.listen(port, () => {
   log('Lobby server running on port ' + port);
});

app.get('/', function (req, res) {
   var sum = 0;
   rooms.forEach((v, k) => sum = sum + v.size);
   res.send('Lobby server<br/>rooms: ' + rooms.size + '<br/>members: ' + sum);
});

signalServer.on('discover', async (request) => {
   log('discover');
   let memberId = request.socket.id;
   let roomId = request.discoveryData["room"];
   var token = request.discoveryData["token"];
   if(token){
      axios.post(`${baseUrl}/join?secret=${godfatherSecretKey}`,{
        "token":token,"room_code":roomId,"action":"play"
    }).then((response)=>{
        console.log(response.data)
         let members = rooms.get(roomId);
      if (!members) {
         members = new Set();
         rooms.set(roomId, members);
      }
      members.add(memberId);
      request.socket.join(roomId)
      request.socket.roomId = roomId;
      request.discover({
         peers: Array.from(members)
      });
      io.to(roomId).emit("join_game",{"status":true,"data":response.data})
      log('joined ' + roomId + ' ' + memberId)
    }).catch((error)=>{
       io.to(request.socket.id).emit("join_game",{"status":false,"data":"Invalid token"})
        if (error.response){
            console.log(error.response.data)
            return error.response.data
        }
        return {}

    })


   }

})

signalServer.on('disconnect', (socket) => {
   let memberId = socket.id;
   let roomId = socket.roomId;
   let members = rooms.get(roomId);
   if (members) {
      members.delete(memberId)
   }
   log('left ' + roomId + ' ' + memberId)
})


io.on('connection', (socket) => {

  socket.on("message",(data)=>{
     socket.emit("message",data)
  })
   socket.on("command",(data)=>{
      if(socket.rooms.has(data["room"])){
         io.to(data["room"]).emit("command",data)
      }
  })
});
signalServer.on('request', (request) => {
   request.forward()
   log('requested')
})

function log(message, data) {
   if (true) {
      console.log(message);
      if (data != null) {
         console.log(data);
      }
   }
}