import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  window.__escaleProInstallPrompt = event
  window.dispatchEvent(new Event('escale-pro-install-ready'))
})

window.addEventListener('appinstalled', () => {
  window.__escaleProInstallPrompt = null
  window.dispatchEvent(new Event('escale-pro-installed'))
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
