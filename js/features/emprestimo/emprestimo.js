import { addLoan } from '../../core/state/loans.js';
import { showToast } from '../../core/toast/toast.js';

export function initEmprestimo() {
    const form = document.querySelector('#panel-emprestimo form');
    if (!form) return;

    const dataInput = document.getElementById('data-emprestimo');
    const picker = criarDataPicker(dataInput);

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
            data: dataInput.value,
            observacao: document.getElementById('observacao').value
        });

        showToast('Empréstimo registrado com sucesso', 'success');
        form.reset();
        picker.setDate(new Date(), false);
        dataInput.classList.add('input-auto');
    });
}

function criarDataPicker(input) {
    return flatpickr(input, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'd/m/Y à\\s H:i',
        locale: 'pt',
        defaultDate: new Date(),
        onChange: () => input.classList.remove('input-auto')
    });
}