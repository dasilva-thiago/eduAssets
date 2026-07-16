import { initNavigation } from './core/navigation/navigation.js';
import { initModals } from './core/modal/modal.js';
import { initDashboard } from './features/dashboard/dashboard.js';
import { initControle } from './features/controle/controle.js';
import { initCadastros } from './features/cadastros/cadastros.js';
import { initEmprestimo } from './features/emprestimo/emprestimo.js';
import { initDevolucao } from './features/devolucao/devolucao.js';
import { initExportar } from './features/exportar/exportar.js';
import { initConfig } from './features/config/config.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initModals();
    initDashboard();
    initControle();
    initCadastros();
    initEmprestimo();
    initDevolucao();
    initExportar();
    initConfig();
});