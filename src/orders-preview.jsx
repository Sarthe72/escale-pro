import React from 'react';
import { createRoot } from 'react-dom/client';
import Commandes from './pages/Commandes';
import CrmSession from './components/CrmSession';
import {HashRouter} from 'react-router-dom';
import './index.css';
// Development entry only, protected by the same session as the complete CRM.
if (import.meta.env.DEV) createRoot(document.getElementById('root')).render(<HashRouter><CrmSession><Commandes/></CrmSession></HashRouter>);
