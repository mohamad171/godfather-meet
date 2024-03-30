<script setup>
import { ref } from "vue";
import {useAppwriteState} from "../stores/appwriteState"


var state = useAppwriteState();
const roomNameInput = defineModel()

state.getRooms()

</script>

<template>
  <main>
    <div class="d-flex align-items-center">
      <div>
      <label>Room name:</label>
      <input class="form-control" v-model="roomNameInput" />
      <button class="btn btn-sm btn-warning mt-2" @click="state.createRoom(roomNameInput)">Create room</button>
    </div>
    </div>
    <hr/>
    <div>
      <label>List of rooms</label>
      <ul class="list-group">
        <li class="list-group-item d-flex justify-content-between" v-for="room in state.rooms">
          <p>{{ room.name }}</p>
          <button class="btn btn-sm btn-success" @click="state.joinRoom(room)">Join</button>
        </li>
      </ul>
    </div>
    

  </main>
</template>
