<script setup>
import {ref} from "vue";
import {useAppwriteState} from "../stores/appwriteState";

var state = useAppwriteState();
const roomNameInput = defineModel();

state.getRooms();
</script>

<template>
  <main class="bg-[#333333] text-[white] h-[100vh]">
    <div class="">
      <div class="flex flex-col">
        <label>oom name:</label>
        <div>
          <input class="w-[200px] m-1" v-model="roomNameInput" />
          <button
            class="m-1 border p-1"
            @click="state.createRoom(roomNameInput)"
          >
            Create room
          </button>
        </div>
      </div>
    </div>
    <hr />
    <div>
      <label class="text-[20px]">List of rooms</label>
      <ul class="list-group">
        <li
          class="list-group-item d-flex justify-content-between border w-[100%] p-2"
          v-for="room in state.rooms"
        >
          <p>{{ room.name }}</p>
          <button class="border p-1" @click="state.joinRoom(room)">
            Join
          </button>
        </li>
      </ul>
    </div>
  </main>
</template>
