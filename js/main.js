import { initNavigation } from './features/navigation/navigation.js';
import { initModals } from './features/modal/modal.js';
import { initDashboard } from './features/dashboard/dashboard.js';
import { initControle } from './features/controle/controle.js';
import { initCadastros } from './features/cadastros/cadastros.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModals();
    initDashboard();
    initControle();
    initCadastros();
});