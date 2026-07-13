import { createApp } from 'vue'
import { createPinia } from 'pinia' // 🌟 ADICIONADO
import App from './App.vue' // cite: main.js
import './assets/main.css' // cite: main.js

const app = createApp(App) // cite: main.js
const pinia = createPinia() // 🌟 ADICIONADO

app.use(pinia) // 🌟 ADICIONADO
app.mount('#app') // cite: main.js