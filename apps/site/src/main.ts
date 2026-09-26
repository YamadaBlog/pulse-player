import { createApp } from 'vue'
import { createMotionCss } from '@pulse-music/tokens'
import App from './App.vue'
import './lib/site'
import './styles/main.css'

// The site animates with the same spring curves as the player.
const motion = document.createElement('style')
motion.textContent = createMotionCss(':root')
document.head.append(motion)

createApp(App).mount('#app')
