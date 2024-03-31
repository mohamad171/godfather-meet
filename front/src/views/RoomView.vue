<script setup>
import { ref } from "vue";
import {useAppwriteState} from "../stores/appwriteState"
import WebrtcComponent from "@/components/WebrtcComponent.vue";

var state = useAppwriteState();


</script>

<template>
  <main>
    <div class="d-flex justify-content-between">
      <p>Room: {{ state.selectedRoom.name }}</p>
      <button class="btn btn-sm btn-danger">Leave</button>
    </div>

    <WebrtcComponent width="150" height="150" :room-id="state.selectedRoom.id"/>

    

  </main>
</template>
