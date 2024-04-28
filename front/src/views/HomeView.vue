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
          <span>User Token</span>
          <input class="w-[200px] m-1" v-model="roomNameInput" />
          <button
            class="m-1 border p-1"
            @click="$router.push(`/room/20890509/${roomNameInput}`);"
          >
            Join room
          </button>
        </div>
      </div>
    </div>
    <hr />

  </main>
</template>
