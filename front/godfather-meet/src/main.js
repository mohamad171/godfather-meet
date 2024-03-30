import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Import Bootstrap and BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'vue-toast-notification/dist/theme-bootstrap.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

  
app.use(pinia)
app.use(router)
app.provide('$router', router);


app.mount('#app')
