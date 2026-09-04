import * as React from 'react'
import { createRoot } from 'react-dom/client'

window.React = React
window.ReactDOM = { createRoot }

Promise.resolve()
  .then(() => import('../public/amethyst/tweaks-panel.jsx'))
  .then(() => import('../public/amethyst/join.jsx'))
