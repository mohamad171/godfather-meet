import socketio
from aiohttp import web

sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()

sio.attach(app)


@sio.on('message')
def on_message_event(sid, data):
    pass


@sio.on('command')
def on_command_event(sid, data):
    pass


@sio.on('players_info')
def on_players_info_event(sid, data):
    pass


@sio.on('load_messages')
def on_load_messages_event(sid, data):
    pass


@sio.on('set_roles')
def on_set_roles_event(sid, data):
    pass


@sio.on('send_action')
def on_send_action_event(sid, data):
    pass


@sio.on('get_actions')
def on_get_actions_event(sid, data):
    pass


@sio.on('discover')
def on_discover_event(sid, data):
    print(data,sid)
    pass


@sio.on('request')
def on_request_event(sid, data):
    pass


@sio.event
def connect(sid, environ, auth):
    print('connect ', sid)


@sio.event
def disconnect(sid):
    print('disconnect ', sid)

@sio.on('*')
def on_all_event(event,sid, data):
    print("All",data,sid)
    pass
if __name__ == "__main__":
    web.run_app(app)



