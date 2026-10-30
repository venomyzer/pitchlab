import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// A mouse click shouldn't leave a button focused: on stream, pressing Space later must never repeat
// the last clicked action (e.g. a goal). Keyboard focus (detail === 0) is left alone.
document.addEventListener('click', e => {
  const b = (e.target as HTMLElement).closest('button, [role="switch"]') as HTMLElement | null
  if (b && e.detail > 0 && !b.closest('[data-keep-focus]')) b.blur()
}, true)

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
