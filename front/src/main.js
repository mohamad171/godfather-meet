import {createApp} from "vue";
import {createPinia} from "pinia";
import "@/assets/css/style.css";
import PrimeVue from "primevue/config";
import "primevue/resources/themes/aura-light-green/theme.css";
import ToastService from "primevue/toastservice";
import App from "./App.vue";
import router from "./router";
const app = createApp(App);
const pinia = createPinia();
app.use(PrimeVue);
app.use(pinia);
app.use(router);
app.use(ToastService);
import "./index.css";
app.provide("$router", router);
app.mount("#app");
