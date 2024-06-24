import socketio
from aiohttp import web
from backend_interface import BackendInterface

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()

sio.attach(app)

rest_api = BackendInterface("ds54fs56d4fx53dfxd")

rooms = {}


def is_in_room(sid, room_id):
    room = rooms.get(room_id)
    if room:
        if "members" in room:
            if sid in room["members"]:
                return True
    return False


@sio.on('message')
def on_message_event(sid, data):
    status, result = rest_api.send_message(data["room"], data["message"], sid, data["receiver"])
    if status:
        if result["data"]["message"]["receiver"]:
            sio.emit(to=result["data"]["message"]["receiver"], event="message", data=result["data"]["message"])


@sio.on('command')
async def on_command_event(sid, data):
    room = data["room"]
    if is_in_room(sid, room):
        status, result = rest_api.command(room, data["command"], sid,
                                          target_socket_id=data[
                                              "target_socket_id"] if "target_socket_id" in data else None)

        if status:
            if data["command"] == "kick":
                pass
            else:
                await sio.emit(to=room, event="command", data=data)


@sio.on('players_info')
async def on_players_info_event(sid, data):
    room = data["room"]
    if is_in_room(sid, room):
        status, result = rest_api.players_info(data["token"], room, sid)
        if status:
            await sio.emit(to=sid, event="players_info", data=result)


#
#
@sio.on('load_messages')
async def on_load_messages_event(sid, data):
    room = data["room"]
    if is_in_room(sid, room):
        status, result = rest_api.messages(room, sid)
        if status:
            await sio.emit(to="load_messages", event="load_messages", data=result)


#
#
# @sio.on('set_roles')
# def on_set_roles_event(sid, data):
#     pass
#
#
@sio.on('send_action')
def on_send_action_event(sid, data):
    status, result = rest_api.send_action(data["room"], sid, data["targets"])
    if status:
        sio.emit(to=f"god-{data['room']}", event="actions", data=result["data"])


#
#
# @sio.on('get_actions')
# def on_get_actions_event(sid, data):
#     pass


@sio.on('simple-signal[discover]')
async def on_discover_event(sid, data):
    print("Start discovering")
    roomId = data["room"]
    token = data["token"]
    if token:
        status, result = rest_api.join(token, roomId, "play", sid)
        if status:
            room = rooms.get(roomId)
            if not room:
                rooms[roomId] = {}
                room = rooms[roomId]
            if "members" not in room:
                members = []
            else:
                members = room["members"]
            members.append(sid)
            room["members"] = members
            rooms[roomId] = room

            if result["data"]["room_role"] == "god":
                await sio.enter_room(sid, f'god-{roomId}')
            elif result["data"]["role"]:
                if result["data"]["role"]["side"] == 0:
                    print("Join to Mafia Room")
                    await sio.enter_room(sid, f'mafia-{roomId}')
            await sio.enter_room(sid, roomId)
            await sio.enter_room(sid, result["data"]["player"]["id"])
            await sio.emit(to=sid, event="simple-signal[discover]",
                           data={"discoveryData": {"id": sid, "peers": members}})
            await sio.emit(to=sid, event="join_game", data={"status": True, "data": result})
        else:
            await sio.emit(to=sid, event="join_game", data={"status": False, "data": "Invalid Token"})


#
# @sio.on('request')
# def on_request_event(sid, data):
#     pass


@sio.event
def connect(sid, environ, auth):
    print('connect ', sid)


@sio.event
def disconnect(sid):
    print('disconnect ', sid)


@sio.on('*')
def on_all_event(event, sid, data):
    print("All", event, data, sid)
    pass


if __name__ == "__main__":
    web.run_app(app)
