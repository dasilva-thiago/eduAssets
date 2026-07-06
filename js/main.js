import { initNavigation } from './features/navigation/navigation.js';
import { initDashboard } from './features/dashboard/dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDashboard();
});