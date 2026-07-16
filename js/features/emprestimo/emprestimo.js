import { addLoan } from '../../core/state/loans.js';
import { showToast } from '../../core/toast/toast.js';

export function initEmprestimo() {
    const form = document.querySelector('#panel-emprestimo form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const responsavelSelect = document.getElementById('responsavel');
        const equipamentoSelect = document.getElementById('equipamento');

        addLoan({
            aluno: document.getElementById('solicitante').value,
            responsavel: responsavelSelect.options[responsavelSelect.selectedIndex].text,
            equipamento: equipamentoSelect.options[equipamentoSelect.selectedIndex].text,
            quantidade: document.getElementById('quantidade').value,
            data: document.getElementById('data-emprestimo').value,
            observacao: document.getElementById('observacao').value
        });

        showToast('Empréstimo registrado com sucesso', 'success');
        form.reset();
    });
}