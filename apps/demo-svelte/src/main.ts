import { mount } from 'svelte'
import App from './App.svelte'
import '../../demo-shared.css'

const target = document.getElementById('root')!
mount(App, { target })
