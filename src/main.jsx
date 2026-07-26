import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

function hideSplash() {
  const splash = document.getElementById('splash')
  if (splash) {
    splash.classList.add('hide')
    setTimeout(() => splash.remove(), 450)
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Ocultar el splash apenas la app montó, con red de seguridad por si algo demora
requestAnimationFrame(hideSplash)
setTimeout(hideSplash, 2000)
