import { getLoans, returnLoan, subscribe } from '../../core/state/loans.js';
import { showToast } from '../../core/toast/toast.js';
import { openModal, closeModal } from '../../core/modal/modal.js';
import { criarDataAutoPicker } from '../../core/datepicker/datepicker.js';

const LIMITE_ITENS_CARD = 2;

export function initDevolucao() {
    const lista = document.getElementById('lista-devolucoes-items');
    if (!lista) return;

    const devolucaoDataInput = document.getElementById('modal-devolucao-data');
    const btnConfirmarDevolucao = document.getElementById('btn-confirmar-devolucao');
    const devolucaoPicker = criarDataAutoPicker(devolucaoDataInput);
    let idPendente = null;

    render(getLoans());
    subscribe(render);

    lista.addEventListener('click', (e) => {
        const btnDevolver = e.target.closest('.devolver-btn');
        if (btnDevolver) {
            idPendente = btnDevolver.dataset.id;
            devolucaoPicker.setDate(new Date(), false);
            devolucaoDataInput.classList.add('input-auto');
            openModal('modal-confirmar-devolucao');
            return;
        }

        const card = e.target.closest('.devolucao-item');
        if (card) abrirDetalhe(card.dataset.id);
    });

    btnConfirmarDevolucao.addEventListener('click', () => {
        if (!idPendente) return;

        returnLoan(idPendente);
        showToast(`Devolução registrada para ${devolucaoDataInput.value}`, 'success');
        closeModal('modal-confirmar-devolucao');
        idPendente = null;
    });

    function render(loans) {
        if (!loans.length) {
            lista.innerHTML = `
                <div class="devolucao-vazia">
                    <img src="assets/logos/eduAssets_logo-empty-state.png" alt="" class="devolucao-vazia-logo">
                    <p class="devolucao-vazia-texto">Empréstimos aparecerão aqui</p>
                    <p class="devolucao-vazia-sub">Registre um novo empréstimo para começar a acompanhar as devoluções.</p>
                </div>
            `;
            return;
        }

        lista.innerHTML = loans.map((loan) => `
            <div class="devolucao-item" data-id="${loan.id}">
                <div class="devolucao-info">
                    <div class="devolucao-linha-principal">
                        <span class="info-resp">${loan.responsavel}</span>
                        <svg class="seta-svg" viewBox="0 0 40 12" xmlns="http://www.w3.org/2000/svg">
                            <line x1="0" y1="6" x2="32" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                            <polyline points="26,1 36,6 26,11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="info-value">${loan.aluno}</span>
                    </div>
                    <div class="devolucao-linha-itens">${formatarItensResumo(loan.itens)}</div>
                    <div class="devolucao-linha-hora">
                        <span class="material-symbols-outlined">schedule</span>
                        <span>${formatarHora(loan.createdAt)}</span>
                        ${loan.observacao ? `<span class="devolucao-obs-indicador" title="Contém observação"><span class="material-symbols-outlined">sticky_note_2</span></span>` : ''}
                    </div>
                </div>
                <button class="btn btn-primary btn-sm devolver-btn" data-id="${loan.id}">Devolver</button>
            </div>
        `).join('');
    }
}

function abrirDetalhe(id) {
    const loan = getLoans().find((l) => l.id === id);
    if (!loan) return;

    document.getElementById('detalhe-emprestimo-resp').textContent = `Responsável: ${loan.responsavel}`;
    document.getElementById('detalhe-emprestimo-aluno').textContent = `Solicitante: ${loan.aluno}`;
    document.getElementById('detalhe-emprestimo-data').textContent = `${loan.data}`;

    document.getElementById('detalhe-emprestimo-lista').innerHTML = loan.itens.map((item) => `
        <li><span class="material-symbols-outlined">check_circle</span>${item.quantidade}x ${item.nome}</li>
    `).join('');

    const obsEl = document.getElementById('detalhe-emprestimo-obs');
    if (loan.observacao) {
        obsEl.style.display = 'block';
        obsEl.innerHTML = `<span class="detalhe-emprestimo-obs-label">Observação</span><p>${loan.observacao}</p>`;
    } else {
        obsEl.style.display = 'none';
        obsEl.innerHTML = '';
    }

    openModal('modal-detalhe-emprestimo');
}

function formatarItensResumo(itens) {
    const visiveis = itens.slice(0, LIMITE_ITENS_CARD).map((item) => `${item.quantidade}x ${item.nome}`);
    const restantes = itens.length - LIMITE_ITENS_CARD;

    if (restantes > 0) visiveis.push(`+${restantes} outro${restantes > 1 ? 's' : ''}`);

    return visiveis.join(' • ');
}

function formatarHora(date) {
    const hoje = new Date();
    const mesmoDia = date.toDateString() === hoje.toDateString();
    const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return mesmoDia ? `Hoje às ${hora}` : `${date.toLocaleDateString('pt-BR')} às ${hora}`;
}