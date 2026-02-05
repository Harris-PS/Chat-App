import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { Auth0Provider } from '@auth0/auth0-react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-75hmnmpo5heusns5.us.auth0.com"
      clientId="0DaV5S7djOgRXZ3q6CaYvHPwQdui4z8e"
      authorizationParams={{
        redirect_uri: "http://localhost:5173",
        audience: "http://localhost:3000"
      }}
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)
