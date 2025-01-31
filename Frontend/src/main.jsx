import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/css/index.css'
import App from './App.jsx'

import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme/appTheme.js'; 



createRoot(document.getElementById('root')).render(
  <StrictMode>
   <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
)
