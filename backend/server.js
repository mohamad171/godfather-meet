const app = require("express")();
const api = require("./godfather_api_interface");
const axios = require("axios");
let godfatherSecretKey = "ds54fs56d4fx53dfxd";
let baseUrl = "https://godfathergame.ir/api/v1/games";
let server = {};

server = require("http").createServer(app);
log("Using http.");

const io = require("socket.io")(server, {cors: true, origins: false});
const signalServer = require("simple-signal-server")(io);
const port = process.env.PORT || 3000;
const rooms = new Map();

server.listen(port, () => {
  log("Lobby server running on port " + port);
});

app.get("/", function (req, res) {
  var sum = 0;
  rooms.forEach((v, k) => (sum = sum + v.size));
  res.send("Lobby server<br/>rooms: " + rooms.size + "<br/>members: " + sum);
});

signalServer.on("discover", async request => {
  log("discover");
  let memberId = request.socket.id;
  let roomId = request.discoveryData["room"];
  var token = request.discoveryData["token"];
  if (token) {
    axios
      .post(`${baseUrl}/join?secret=${godfatherSecretKey}`, {
        token: token,
        room_code: roomId,
        action: "play",
        socket_id: request.socket.id
      })
      .then(response => {
        let members = rooms.get(roomId);
        if (!members) {
          members = new Set();
          rooms.set(roomId, members);
        }
        members.add(memberId);
        request.socket.join(roomId);
        request.socket.roomId = roomId;
        console.log(Array.from(members));
        request.discover({
          peers: Array.from(members)
        });
        if (response.data.data["room_role"] === "god") {
          request.socket.join(`god-${roomId}`);
        } else if (response.data["data"]["role"]) {
          if (response.data["data"]["role"]["side"] === 0) {
            console.log("Add To mafia room");
            request.socket.join(`mafia-${roomId}`);
          }
        }
        console.log("User id:", response.data.data["player"]["id"]);
        request.socket.join(`${response.data.data["player"]["id"]}`);

        io.to(memberId).emit("join_game", {status: true, data: response.data});
        log("joined " + roomId + " " + memberId);
      })
      .catch(error => {
        io.to(request.socket.id).emit("join_game", {
          status: false,
          data: "Invalid token"
        });
        if (error.response) {
          console.log(error.response.data);
        }
      });
  }
});

signalServer.on("disconnect", socket => {
  let memberId = socket.id;
  let roomId = socket.roomId;
  let members = rooms.get(roomId);
  if (members) {
    members.delete(memberId);
  }
  axios
    .post(`${baseUrl}/leave?secret=${godfatherSecretKey}`, {
      room_code: roomId,
      socket_id: socket.id
    })
    .then(value => {
      io.to(roomId).emit("leave_room", value.data);
    })
    .catch(error => {});
  // io.to(roomId).emit("leave_room",{"status":"ok"})
  log("left " + roomId + " " + memberId);
});

io.on("connection", socket => {
  console.log("Connect");
  socket.on("message", data => {
    axios
      .post(`${baseUrl}/send-message?secret=${godfatherSecretKey}`, {
        room_code: data["room"],
        socket_id: socket.id,
        message: data["message"],
        receiver: data["receiver"]
      })
      .then(value => {
        if (value.data["status"] === "ok") {
          if (value.data["data"]["message"]["receiver"]) {
            console.log("Send to", value.data["data"]["message"]["receiver"]);
            io.to(`${value.data["data"]["message"]["receiver"]}`).emit(
              "message",
              value.data["data"]["message"]
            );
          }
        }
      })
      .catch(error => {
        console.log(error);
      });
  });
  socket.on("command", data => {
    if (socket.rooms.has(data["room"])) {
      axios
        .post(`${baseUrl}/command?secret=${godfatherSecretKey}`, {
          room_code: data["room"],
          socket_id: socket.id,
          command: data["command"],
          target_socket_id:
            "target_socket_id" in data ? data["target_socket_id"] : null
        })
        .then(value => {
          if (data["command"] === "kick") {
            io.in(data["room"])
              .fetchSockets()
              .then(sockets => {
                for (const s of sockets) {
                  if (s.id === data["target_socket_id"]) {
                    s.leave(data["room"]);
                    s.disconnect();
                  }
                }
              });
          }
          io.to(data["room"]).emit("command", data);
        })
        .catch(error => {});
    }
  });
  socket.on("players_info", data => {
    if (socket.rooms.has(data["room"])) {
      axios
        .post(`${baseUrl}/playerinfo?secret=${godfatherSecretKey}`, {
          room_code: data["room"],
          socket_id: socket.id,
          token: data["token"]
        })
        .then(value => {
          io.to(data["room"]).emit("players_info", value.data);
        })
        .catch(error => {});
    }
  });

  socket.on("load_messages", data => {
    console.log("Rooom is:", data["room"]);
    if (socket.rooms.has(data["room"])) {
      axios
        .post(`${baseUrl}/messages?secret=${godfatherSecretKey}`, {
          room_code: data["room"],
          socket_id: socket.id
        })
        .then(value => {
          console.log(value.data);
          socket.emit("load_messages", value.data);
        })
        .catch(error => {});
    }
  });

  socket.on("set_roles", data => {
    console.log(data);
    if (socket.rooms.has(data["room"])) {
      axios
        .post(`${baseUrl}/set-roles?secret=${godfatherSecretKey}`, {
          room_code: data["room"],
          socket_id: socket.id
        })
        .then(value => {
          value.data["data"]["players"].forEach(player => {
            console.log(player);
            if (player.room_role === "player") {
              const socket_ins = io.sockets.sockets.get(player.socket_id);

              if (player.role.side === 0 && socket_ins) {
                socket_ins.join(`mafia-${player.room__code}`);
              }

              io.to(player["socket_id"]).emit("role", player);
            }
          });
        })
        .catch(error => {});
    }
  });

  socket.on("send_action", data => {
    axios
      .post(`${baseUrl}/send-action?secret=${godfatherSecretKey}`, {
        room_code: data["room"],
        socket_id: socket.id,
        targets: data["targets"]
      })
      .then(value => {
        if (value.data["status"] === "ok") {
          io.to(`god-${data["room"]}`).emit("actions", value.data["data"]);
        }
      })
      .catch(error => {
        console.log(error);
      });
  });

  socket.on("get_actions", data => {
    axios
      .post(`${baseUrl}/actions?secret=${godfatherSecretKey}`, {
        room_code: data["room"],
        socket_id: socket.id
      })
      .then(value => {
        if (value.data["status"] === "ok") {
          io.to(`god-${data["room"]}`).emit("actions", value.data["data"]);
        }
      })
      .catch(error => {
        console.log(error);
      });
  });
});
signalServer.on("request", request => {
  request.forward();
  log("requested");
});

function log(message, data) {
  if (true) {
    console.log(message);
    if (data != null) {
      console.log(data);
    }
  }
}
