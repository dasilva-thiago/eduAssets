import { showToast } from '../../core/toast/toast.js';

export function initConfig() {
    const btnSalvar = document.getElementById('config-salvar');
    if (!btnSalvar) return;

    btnSalvar.addEventListener('click', () => {
        showToast('Configurações salvas com sucesso', 'success');
    });
}