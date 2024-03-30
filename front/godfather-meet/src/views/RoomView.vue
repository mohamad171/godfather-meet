<script setup>
import { ref } from "vue";
import {useAppwriteState} from "../stores/appwriteState"


var state = useAppwriteState();

</script>

<template>
  <main>
    <div class="d-flex justify-content-between">
      <p>Room: {{ state.selectedRoom.name }}</p>
      <button class="btn btn-sm btn-danger">Leave</button>
    </div>
    

  </main>
</template>
