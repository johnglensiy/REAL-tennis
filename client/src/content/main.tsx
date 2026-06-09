import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import styles from '../index.css?inline'
import Sidebar from './content'

const host = document.createElement('div')
host.style.cssText = `
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 999999;
  display: inline-block;
`
document.body.appendChild(host)

const shadow = host.attachShadow({ mode: 'open' })

const style = document.createElement('style')
style.textContent = styles
shadow.appendChild(style)

const root = document.createElement('div')
root.id = 'root'
shadow.appendChild(root)

createRoot(root).render(
  <StrictMode>
    <Sidebar />
  </StrictMode>,
)