import React from 'react';
import {createRoot} from 'react-dom/client';
import RadarApp from '../app/radar-app';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><RadarApp/></React.StrictMode>);
