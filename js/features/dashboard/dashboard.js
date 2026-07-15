import { openModal, closeModal } from '../modal/modal.js';

export function initDashboard() {
    const estoqueContainer = document.getElementById('tab-estoque');
    if (!estoqueContainer) return;

    const btnEditar = document.getElementById('btn-editar');
    const btnDeletar = document.getElementById('btn-deletar');

    const selecionados = new Set();
    let editandoId = null;

    estoqueContainer.addEventListener('change', (e) => {
        if (!e.target.classList.contains('estoque-checkbox')) return;
        const id = e.target.dataset.id;
        e.target.checked ? selecionados.add(id) : selecionados.delete(id);
        atualizarToolbar();
    });

    function atualizarToolbar() {
        if (btnEditar) btnEditar.disabled = selecionados.size !== 1;
        if (btnDeletar) btnDeletar.disabled = selecionados.size === 0;
    }

    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            if (selecionados.size !== 1) return;
            editandoId = [...selecionados][0];
            const row = estoqueContainer.querySelector(`.estoque-row[data-id="${editandoId}"]`);
            preencherModal(row);
            openModal('modal-editar-estoque');
        });
    }

    function preencherModal(row) {
        if (!row) return;
        const categoria = document.getElementById('modal-categoria');
        const total = document.getElementById('modal-total');
        const disponivel = document.getElementById('modal-disponivel');
        const quebrado = document.getElementById('modal-quebrado');

        if (categoria) categoria.value = row.dataset.categoria || '';
        if (total) total.value = row.dataset.total || '';
        if (disponivel) disponivel.value = row.dataset.disponivel || '';
        if (quebrado) quebrado.value = row.dataset.quebrado || '';
    }

    const btnLimpar = document.getElementById('modal-limpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            const row = estoqueContainer.querySelector(`.estoque-row[data-id="${editandoId}"]`);
            if (row) preencherModal(row);
        });
    }

    const btnSalvar = document.getElementById('modal-salvar');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', () => {
            const row = estoqueContainer.querySelector(`.estoque-row[data-id="${editandoId}"]`);
            if (!row) return;

            const novoTotal = document.getElementById('modal-total')?.value || '0';
            const novoDisponivel = document.getElementById('modal-disponivel')?.value || '0';
            const novoQuebrado = document.getElementById('modal-quebrado')?.value || '0';

            row.dataset.total = novoTotal;
            row.dataset.disponivel = novoDisponivel;
            row.dataset.quebrado = novoQuebrado;

            const spans = row.querySelectorAll('span');
            if (spans.length >= 4) {
                spans[1].textContent = novoTotal;
                spans[2].textContent = novoDisponivel;
                spans[3].textContent = novoQuebrado;
            }

            closeModal('modal-editar-estoque');
            editandoId = null;
        });
    }

    if (btnDeletar) {
        btnDeletar.addEventListener('click', () => {
            selecionados.forEach((id) => {
                estoqueContainer.querySelector(`.estoque-row[data-id="${id}"]`)?.remove();
            });
            selecionados.clear();
            atualizarToolbar();
        });
    }

    document.querySelectorAll('.dashboard-tab-link').forEach((tabLink) => {
        tabLink.addEventListener('click', () => {
            document.querySelectorAll('.dashboard-tab-link').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.dashboard-tab-content').forEach(c => c.classList.remove('active'));

            tabLink.classList.add('active');
            const targetTab = document.getElementById(`tab-${tabLink.dataset.tab}`);
            if (targetTab) targetTab.classList.add('active');
        });
    });
}