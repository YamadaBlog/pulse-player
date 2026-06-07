import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Other from './pages/Other.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/other', component: Other },
  ],
})
