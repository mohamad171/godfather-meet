import requests


class BackendInterface:
    base_url = "https://godfathergame.ir/api/v1/games"

    def __init__(self, token):
        self.token = token

    def join(self, token, room_code, action, socket_id):
        data = {
            "token": token,
            "room_code": room_code,
            "action": action,
            "socket_id": socket_id
        }
        response = requests.post(f"{self.base_url}/join?secret={self.token}", data=data)
        if response.status_code == 200:
            return True, response.json()
        return False, None
    def players_info(self, token, room_code, socket_id):
        data = {
            "token": token,
            "room_code": room_code,
            "socket_id": socket_id
        }
        response = requests.post(f"{self.base_url}/playerinfo?secret={self.token}", data=data)
        if response.status_code == 200:
            return True, response.json()
        return False, None
    def messages(self, room_code, socket_id):
        data = {
            "room_code": room_code,
            "socket_id": socket_id
        }
        response = requests.post(f"{self.base_url}/messages?secret={self.token}", data=data)
        if response.status_code == 200:
            return True, response.json()
        return False, None
    def command(self, room_code,command, socket_id,target_socket_id):
        data = {
            "room_code": room_code,
            "socket_id": socket_id,
            "command": command,
            "target_socket_id": target_socket_id
        }
        response = requests.post(f"{self.base_url}/command?secret={self.token}", data=data)
        if response.status_code == 200:
            return True, response.json()
        return False, None