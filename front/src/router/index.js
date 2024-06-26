import {createRouter, createWebHistory} from "vue-router";
import HomeView from "../views/HomeView.vue";
import RoomView from "../views/RoomView.vue";
import goodbyeScreen from "../views/goodbyeScreen.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/:room_id/:token",
      name: "home",
      component: HomeView
    },
    {
      path: "/room/:room_id/:token",
      name: "room",
      component: RoomView
    },
    {
      path: "/goodbye-screen",
      name: "goodbyeScreen",
      component: goodbyeScreen
    }
  ]
});

export default router;
