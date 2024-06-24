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
async def on_message_event(sid, data):
    print(data)
    status, result = rest_api.send_message(data["room"], data["message"], sid, data["receiver"] if "receiver" in data else None)
    if status:
        for message in result["data"]["message"]:
            if message["receiver"]:
                print(f"Send message to {message['receiver']}")
                await sio.emit(to=message["receiver"], event="message", data=message)


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
    print("Load messages...",sid)
    if is_in_room(sid, room):
        status, result = rest_api.messages(room, sid)
        if status:
            await sio.emit(to=sid, event="load_messages", data=result)



@sio.on('set_roles')
async def on_set_roles_event(sid, data):
    room = data["room"]
    if is_in_room(sid,room):
        status , result = rest_api.set_roles(room,sid)
        if status:
            for player in result["data"]["players"]:
                if player["room_role"] == "player":
                    if player["role"]["side"] == 0:
                        await sio.enter_room(player["socket_id"],room=f'mafia-{player["room"]["code"]}')

                    await sio.emit(to=player["socket_id"],event="role",data=player)






@sio.on('send_action')
async def on_send_action_event(sid, data):
    status, result = rest_api.send_action(data["room"], sid, data["targets"])
    if status:
        await sio.emit(to=f"god-{data['room']}", event="actions", data=result["data"])


#
#
@sio.on('get_actions')
async def on_get_actions_event(sid, data):
    status, result = rest_api.get_actions(data["room"], sid)
    if status:
        await sio.emit(to=f"god-{data['room']}", event="actions", data=result["data"])


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
            print(result["data"]["player"]["id"])
            await sio.enter_room(sid, str(result["data"]["player"]["id"]))
            discover_data = {"id": sid,"discoveryData": {"id": sid, "peers": members}}
            await sio.emit(to=sid, event="simple-signal[discover]",
                           data=discover_data)
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
    for key,value in rooms.items():
        if "members" in value and sid in value["members"]:
            value["members"].remove(sid)
            # rooms[key]["memebrs"] = value["members"]
    print('disconnect ', sid)

@sio.on("simple-signal[offer]")
async def on_offer_event(sid, data):
    print('New offer ',{
        "initiator":sid,"sessionId":data["sessionId"],"signal":data["signal"],
        "metadata":data["metadata"],"target":data["target"]
    })
    await sio.emit(to=data["target"], event="simple-signal[offer]",data={
        "initiator":sid,"sessionId":data["sessionId"],"signal":data["signal"],
        "metadata":data["metadata"]
    })


@sio.on("simple-signal[signal]")
async def on_signal_event(sid, data):
    print('New signal ', sid)
    await sio.emit(to=data["target"],event="simple-signal[signal]",data = {
        "sessionId":data["sessionId"],"signal":data["signal"],"metadata":data["metadata"]
    })


@sio.on("simple-signal[accept]")
def on_accept_event(sid, data):
    print('accept ', sid, data)


@sio.on('*')
def on_all_event(event, sid, data):
    print("All", event, data, sid)
    pass


if __name__ == "__main__":
    web.run_app(app)
