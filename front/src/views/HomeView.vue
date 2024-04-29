<script setup>
import {ref} from "vue";
import {useAppwriteState} from "../stores/appwriteState";

</script>

<template>
  <p>درحال انتقال به اتاق بازی</p>
  <a :href=" `/room/${$route.params.room_id}/${$route.params.token}`">ورود</a>
</template>
