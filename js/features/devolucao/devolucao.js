import { getLoans, returnLoan, subscribe } from '../../core/state/loans.js';
import { showToast } from '../../core/toast/toast.js';

export function initDevolucao() {
    const lista = document.getElementById('lista-devolucoes-items');
    if (!lista) return;

    render(getLoans());
    subscribe(render);

    lista.addEventListener('click', (e) => {
        const btn = e.target.closest('.devolver-btn');
        if (!btn) return;
        returnLoan(btn.dataset.id);
        showToast('Devolução registrada com sucesso', 'success');
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
        <div class="devolucao-item">
            <div class="devolucao-info">
                <span class="info-resp">${loan.responsavel}</span>
                <svg class="seta-svg" viewBox="0 0 40 12" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="6" x2="32" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    <polyline points="26,1 36,6 26,11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="info-value">${loan.aluno}</span>
                <span class="info-value">${loan.quantidade} ${loan.equipamento}</span>
                <span class="info-dot"></span>
                <span class="info-value">${formatarHora(loan.createdAt)}</span>
            </div>
            <button class="btn btn-primary btn-sm devolver-btn" data-id="${loan.id}">Devolver</button>
        </div>
    `).join('');
    }

    function formatarHora(date) {
        const hoje = new Date();
        const mesmoDia = date.toDateString() === hoje.toDateString();
        const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return mesmoDia ? `Hoje às ${hora}` : `${date.toLocaleDateString('pt-BR')} às ${hora}`;
    }
}