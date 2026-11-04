import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Atelier } from './Atelier';
import '@/styles/polices';
import './atelier.css';

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <Atelier />
  </StrictMode>
);
