<script setup>
import {ref} from "vue";
import {useAppwriteState} from "../stores/appwriteState";

</script>

<template>
  <p>برای ورود به اتاق کلیک کنید</p>
  <a class="btn" :href=" `/room/${$route.params.room_id}/${$route.params.token}`">ورود</a>
</template>
