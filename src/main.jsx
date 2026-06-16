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
  let users = [];
  if (saved) {
    try {
      users = JSON.parse(saved);
    } catch (e) {}
  }
  
  if (!Array.isArray(users) || users.length === 0) {
    users = [
      {
        id: 'admin',
        name: 'Admin User',
        password: 'admin123',
        role: 'ADMIN',
        accessPages: [],
        weekOff: 'Sunday'
      },
      {
        id: 'user',
        name: 'Demo User',
        password: 'user123',
        role: 'USER',
        accessPages: [],
        weekOff: 'Sunday'
      }
    ];
    localStorage.setItem('users', JSON.stringify(users));
  } else {
    let modified = false;
    let adminUser = users.find(u => u.id === 'admin');
    if (!adminUser) {
      users.push({
        id: 'admin',
        name: 'Admin User',
        password: 'admin123',
        role: 'ADMIN',
        accessPages: [],
        weekOff: 'Sunday'
      });
      modified = true;
    } else if (adminUser.password === '123') {
      adminUser.password = 'admin123';
      modified = true;
    }
    
    let regularUser = users.find(u => u.id === 'user');
    if (!regularUser) {
      users.push({
        id: 'user',
        name: 'Demo User',
        password: 'user123',
        role: 'USER',
        accessPages: [],
        weekOff: 'Sunday'
      });
      modified = true;
    }
    
    if (modified) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }
  return users;
};
window.saveUsers = (users) => {
  localStorage.setItem('users', JSON.stringify(users));
};
window.generateFilterOptions = (data, accessor) => {
  if (!Array.isArray(data)) return [];
  const counts = {};
  data.forEach(item => {
    let val;
    if (typeof accessor === 'function') {
      val = accessor(item);
    } else if (typeof accessor === 'string') {
      val = item[accessor];
    }
    if (val !== undefined && val !== null && val !== '') {
      counts[val] = (counts[val] || 0) + 1;
    }
  });
  return Object.keys(counts)
    .sort()
    .map(key => ({ value: key, label: key, count: counts[key] }));
};
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