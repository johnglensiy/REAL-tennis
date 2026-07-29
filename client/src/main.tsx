import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import 'flag-icons/css/flag-icons.min.css'
import './index.css'
import LandingPage from './marketing/LandingPage.tsx'
import { store } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <LandingPage />
    </Provider>
  </StrictMode>,
)
