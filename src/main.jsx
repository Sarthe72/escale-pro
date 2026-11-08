import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {prepareUpdateBackup} from './lib/updateBackup'

// Read-only copy of the existing documents before mounting the new interface.
Promise.race([prepareUpdateBackup(),new Promise(resolve=>setTimeout(resolve,1500))]).catch(()=>{}).finally(()=>{
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
})
