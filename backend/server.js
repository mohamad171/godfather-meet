const app = require('express')();
const api = require('./godfather_api_interface')
const axios = require("axios");
let godfatherSecretKey = "ds54fs56d4fx53dfxd";
let baseUrl = "https://godfathergame.ir/api/v1/games"
let server = {};

server = require('http').createServer(app);
log('Using http.');


const io = require('socket.io')(server, {cors: true, origins: false});
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
    if (token) {
        axios.post(`${baseUrl}/join?secret=${godfatherSecretKey}`, {
            "token": token, "room_code": roomId, "action": "play",
            "socket_id": request.socket.id
        }).then((response) => {
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
            console.log(response.data)
            if(response.data["room_role"] === "god")
                request.socket.join(`god-${roomId}`);
            else if(response.data["data"]["role"]){
                console.log("User has role")
                if(response.data["data"]["role"]["side"] === 0){
                    console.log("Add To mafia room")
                    request.socket.join(`mafia-${roomId}`);
                }
            }
            io.to(roomId).emit("join_game", {"status": true, "data": response.data})
            log('joined ' + roomId + ' ' + memberId)
        }).catch((error) => {
            io.to(request.socket.id).emit("join_game", {"status": false, "data": "Invalid token"})
            if (error.response) {
                console.log(error.response.data)
            }

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
    axios.post(`${baseUrl}/leave?secret=${godfatherSecretKey}`, {
                "room_code": roomId, "socket_id": socket.id,
            }).then(value => {
                io.to(roomId).emit("leave_room", value.data)
            }).catch((error) => {

    })
    // io.to(roomId).emit("leave_room",{"status":"ok"})
    log('left ' + roomId + ' ' + memberId)
})


io.on('connection', (socket) => {

    socket.on("message", (data) => {
        axios.post(`${baseUrl}/send-message?secret=${godfatherSecretKey}`, {
                "room_code": data["room"],
                "socket_id": socket.id,
                "message":data["message"]
            }).then(value => {
                if(value.data["status"] === "ok"){
                    if(value.data["data"]["message"]["receiver"]){
                        console.log("Send to",value.data["data"]["message"]["receiver"])
                        io.to(value.data["data"]["message"]["receiver"]).emit("message",value.data["data"]["message"])
                    }

                }
            }).catch( (error) => {
                console.log(error)
            })

    })
    socket.on("command", (data) => {

        if (socket.rooms.has(data["room"])) {
            axios.post(`${baseUrl}/command?secret=${godfatherSecretKey}`, {
                "room_code": data["room"], "socket_id": socket.id,"command":data["command"]
            }).then(value => {
                io.to(data["room"]).emit("command", data)
            }).catch( (error) => {

            })

        }
    })
    socket.on("players_info", (data) => {
        if (socket.rooms.has(data["room"])) {
            axios.post(`${baseUrl}/playerinfo?secret=${godfatherSecretKey}`, {
                "room_code": data["room"], "socket_id": socket.id,"token":data["token"]
            }).then(value => {
                console.log(value.data)
                io.to(data["room"]).emit("players_info", value.data)
            }).catch( (error) => {

            })
        }

    })

    socket.on("set_roles",(data) => {
        console.log(data)
        if (socket.rooms.has(data["room"])) {

            axios.post(`${baseUrl}/set-roles?secret=${godfatherSecretKey}`, {
                "room_code": data["room"],
                "socket_id": socket.id
            }).then(value => {
                value.data["data"]["players"].forEach( (player) => {
                    console.log(player)
                    if(player.room_role === "player"){
                        const socket_ins = io.sockets.sockets.get(player.socket_id);

                        if(player.role.side === 0 && socket_ins){
                            socket_ins.join(`mafia-${player.room__code}`)
                        }

                        io.to(player["socket_id"]).emit("role", player)
                    }

                } )
            }).catch( (error) => {
            })

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