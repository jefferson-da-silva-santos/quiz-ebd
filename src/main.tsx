import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/anton/400.css';
import '@fontsource/yellowtail/400.css';
import '@fontsource-variable/archivo/wdth.css';
import 'boxicons/css/boxicons.min.css';
import 'aos/dist/aos.css';
import './styles/global.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('#root não encontrado');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
