const estoqueContainer = document.getElementById('tab-estoque');
const btnEditar = document.getElementById('btn-editar');
const btnDeletar = document.getElementById('btn-deletar');
const modal = document.getElementById('modal-editar-estoque');

const selecionados = new Set();
let editandoId = null;

// Delegação de evento para checkboxes de estoque
estoqueContainer.addEventListener('change', (e) => {
    if (!e.target.classList.contains('estoque-checkbox')) return;

    const id = e.target.dataset.id;
    e.target.checked ? selecionados.add(id) : selecionados.delete(id);
    atualizarToolbar();
});

function atualizarToolbar() {
    btnEditar.disabled = selecionados.size !== 1;
    btnDeletar.disabled = selecionados.size === 0;
}

btnEditar.addEventListener('click', () => {
    if (selecionados.size !== 1) return;

    editandoId = [...selecionados][0];
    const row = estoqueContainer.querySelector(`.estoque-row[data-id="${editandoId}"]`);
    preencherModal(row);
    modal.classList.add('active');
});

function preencherModal(row) {
    document.getElementById('modal-categoria').value = row.dataset.categoria;
    document.getElementById('modal-total').value = row.dataset.total;
    document.getElementById('modal-disponivel').value = row.dataset.disponivel;
    document.getElementById('modal-quebrado').value = row.dataset.quebrado;
}

document.getElementById('modal-limpar').addEventListener('click', () => {
    const row = estoqueContainer.querySelector(`.estoque-row[data-id="${editandoId}"]`);
    preencherModal(row);
});

document.getElementById('modal-salvar').addEventListener('click', () => {
    const row = estoqueContainer.querySelector(`.estoque-row[data-id="${editandoId}"]`);
    const novoTotal = document.getElementById('modal-total').value;
    const novoDisponivel = document.getElementById('modal-disponivel').value;
    const novoQuebrado = document.getElementById('modal-quebrado').value;

    row.dataset.total = novoTotal;
    row.dataset.disponivel = novoDisponivel;
    row.dataset.quebrado = novoQuebrado;

    const spans = row.querySelectorAll('span');
    spans[1].textContent = novoTotal;
    spans[2].textContent = novoDisponivel;
    spans[3].textContent = novoQuebrado;

    modal.classList.remove('active');
    editandoId = null;
});

btnDeletar.addEventListener('click', () => {
    selecionados.forEach((id) => {
        estoqueContainer.querySelector(`.estoque-row[data-id="${id}"]`)?.remove();
    });
    selecionados.clear();
    atualizarToolbar();
});

// tab switch Estoque/Registros
document.querySelectorAll('.dashboard-tab-link').forEach((tabLink) => {
    tabLink.addEventListener('click', () => {
        document.querySelectorAll('.dashboard-tab-link').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.dashboard-tab-content').forEach(c => c.classList.remove('active'));

        tabLink.classList.add('active');
        document.getElementById(`tab-${tabLink.dataset.tab}`).classList.add('active');
    });
});