import { mount } from 'svelte'
import App from './App.svelte'
import './main.css'

const target = document.getElementById('root')!
mount(App, { target })
