import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Inject safe defaults globally to prevent ReferenceErrors
window.calculateDelay = () => 0;
window.formatTargetDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
window.getOrderTypeColor = () => "transparent";
window.getUsers = () => {
  const saved = localStorage.getItem('users');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return [{
    id: 'admin',
    name: 'Admin User',
    password: '123',
    role: 'ADMIN',
    accessPages: [],
    weekOff: 'Sunday'
  }];
};
window.saveUsers = (users) => {
  localStorage.setItem('users', JSON.stringify(users));
};
window.generateFilterOptions = () => [];
window.saveOrderAndSyncPlannedDates = async () => {};
window.preventInvalidDecimalChars = () => {};
window.getSidebarPendingCounts = () => ({});
window.initGlobalInputRestriction = () => {};
window.initializeStorage = () => {};
window.useKarigarOptions = () => {
  const saved = localStorage.getItem('master_karigars_v4');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.map(k => ({ 
        value: k.name, 
        label: `${k.name} (${k.type || 'Office'})` 
      }));
    } catch (e) {}
  }
  return [];
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);