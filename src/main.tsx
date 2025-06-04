import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './context/AppContext';

const root = document.getElementById('root')

if (root) {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <AppProvider>
          <App />
        </AppProvider>
      </React.StrictMode>
    )
    console.log('React rendering successful')
  } catch (error) {
    console.error('Error rendering React application:', error)
    const errorDisplay = document.getElementById('error-display')
    if (errorDisplay) {
      errorDisplay.innerHTML = `<strong>React Rendering Error:</strong><br>${error}`
      errorDisplay.style.display = 'block'
    }
  }
} else {
  console.error('Root element not found')
  document.body.innerHTML = '<div style="padding: 2rem;"><h1>Error: Root element not found</h1></div>'
}
