import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setAudioTracks } from '../../../src/lib'
import App from './App.vue'

// Replace the default 2-track demo playlist BEFORE the store is first
// consumed by any component.
setAudioTracks([
  {
    title: 'NIGHT WALK',
    src: '/audio/night-walk.mp3',
    cover: '/img/night-walk.jpg',
    coverPos: '50% 60%',
  },
  {
    title: 'CITY RAIN',
    src: '/audio/city-rain.mp3',
    cover: '/img/city-rain.jpg',
    coverPos: 'center',
  },
])

createApp(App).use(createPinia()).mount('#app')
