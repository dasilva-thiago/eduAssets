import { openModal, closeModal } from '../../core/modal/modal.js';

const PROBLEMA_ICONS = {
    tela: { label: 'Tela', icon: 'monitor' },
    audio: { label: 'Áudio', icon: 'headphones' },
    bateria: { label: 'Bateria', icon: 'battery_alert' },
    cabo: { label: 'Cabo', icon: 'cable' },
    touch: { label: 'Touch', icon: 'touch_app' },
    teclado: { label: 'Teclado', icon: 'keyboard' },
    botao: { label: 'Botão', icon: 'smart_button' },
    carcaca: { label: 'Carcaça', icon: 'construction' },
    outro: { label: 'Outro', icon: 'help' }
};

const ICONE_POR_TIPO = {
    observacao: 'chat_bubble',
    manutencao: 'build',
    quebrado: 'heart_broken'
};

const TITULOS_POR_TIPO = {
    observacao: 'Nova Observação',
    manutencao: 'Nova Manutenção',
    quebrado: 'Registrar Quebra'
};

export function initControle() {
    const registrosContainer = document.querySelector('.controle-registros-container');
    if (!registrosContainer) return;

    const btnNovo = document.getElementById('btn-novo-registro');
    const menuNovo = document.getElementById('novo-registro-menu');
    const btnEditar = document.getElementById('btn-editar-registro');
    const btnDeletar = document.getElementById('btn-deletar-registro');
    const paginacaoTexto = document.getElementById('controle-paginacao-texto');

    let linhaSelecionada = null;
    let tipoAtual = null;

    /* ===== Tabs: Observação | Manutenção | Quebrado | Resolvidos ===== */
    document.querySelectorAll('.controle-tab-link').forEach((tabLink) => {
        tabLink.addEventListener('click', () => ativarAba(tabLink.dataset.controleTab));
    });

    /* ===== Cards de resumo clicáveis ===== */
    document.querySelectorAll('.controle-resumo-card').forEach((card) => {
        card.addEventListener('click', () => ativarAba(card.dataset.controleTab));
    });

    function ativarAba(tab) {
        document.querySelectorAll('.controle-tab-link').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.controle-tab-content').forEach(c => c.classList.remove('active'));

        const tabLink = document.querySelector(`.controle-tab-link[data-controle-tab="${tab}"]`);
        const targetTab = document.getElementById(`tab-${tab}`);

        if (tabLink) tabLink.classList.add('active');
        if (targetTab) targetTab.classList.add('active');

        limparSelecao();
        fecharTodosMenus();
        atualizarPaginacaoTexto(targetTab);
    }

    function atualizarPaginacaoTexto(tabContent) {
        if (!tabContent || !paginacaoTexto) return;
        const total = tabContent.querySelectorAll('.registros-row').length;
        paginacaoTexto.textContent = total > 0
            ? `Mostrando 1 a ${total} de ${total} registros`
            : 'Nenhum registro encontrado';
    }

    /* ===== Dropdown "+Novo" ===== */
    if (btnNovo && menuNovo) {
        btnNovo.addEventListener('click', (e) => {
            e.stopPropagation();
            menuNovo.classList.toggle('active');
        });

        menuNovo.querySelectorAll('.novo-registro-opcao').forEach((opcao) => {
            opcao.addEventListener('click', () => {
                const tipo = opcao.dataset.tipo;
                menuNovo.classList.remove('active');
                abrirNovoRegistro(tipo);
            });
        });
    }

    document.addEventListener('click', (e) => {
        if (menuNovo && !menuNovo.contains(e.target) && e.target !== btnNovo) {
            menuNovo.classList.remove('active');
        }
        fecharTodosMenus(e.target);
    });

    /* ===== Modal: novo registro ===== */
    const modalTitle = document.getElementById('controle-modal-title');
    const campoCategoria = document.getElementById('controle-modal-categoria');
    const campoModelo = document.getElementById('controle-modal-modelo');
    const campoNumero = document.getElementById('controle-modal-numero');
    const campoProblema = document.getElementById('controle-modal-problema');
    const campoDescricao = document.getElementById('controle-modal-descricao');
    const btnModalCancelar = document.getElementById('controle-modal-cancelar');
    const btnModalSalvar = document.getElementById('controle-modal-salvar');

    function abrirNovoRegistro(tipo) {
        tipoAtual = tipo;
        if (modalTitle) modalTitle.textContent = TITULOS_POR_TIPO[tipo] || 'Novo Registro';

        [campoCategoria, campoModelo, campoNumero, campoDescricao].forEach((campo) => {
            if (campo) campo.value = '';
        });
        if (campoProblema) campoProblema.value = '';

        openModal('modal-controle-novo');
    }

    if (btnModalCancelar) {
        btnModalCancelar.addEventListener('click', () => closeModal('modal-controle-novo'));
    }

    if (btnModalSalvar) {
        btnModalSalvar.addEventListener('click', () => {
            if (!tipoAtual) return;

            if (!campoCategoria.value || !campoModelo.value || !campoNumero.value || !campoProblema.value) {
                campoProblema.reportValidity ? campoProblema.reportValidity() : null;
                return;
            }

            adicionarRegistro(tipoAtual, {
                categoria: campoCategoria.value,
                modelo: campoModelo.value,
                numero: campoNumero.value,
                problema: campoProblema.value,
                descricao: campoDescricao.value || '—'
            });

            closeModal('modal-controle-novo');
        });
    }

    function adicionarRegistro(tipo, dados) {
        const tabContent = document.getElementById(`tab-${tipo}`);
        if (!tabContent) return;

        const problemaInfo = PROBLEMA_ICONS[dados.problema] || PROBLEMA_ICONS.outro;
        const iconeLinha = ICONE_POR_TIPO[tipo] || 'chat_bubble';
        const id = crypto.randomUUID();

        const row = document.createElement('div');
        row.className = 'registros-row';
        row.dataset.id = id;
        row.dataset.problema = dados.problema;
        row.innerHTML = `
            <span class="registros-row-icon"><span class="material-symbols-outlined">${iconeLinha}</span></span>
            <span>${dados.categoria}</span>
            <span>${dados.modelo}</span>
            <span class="registros-numero">${dados.numero}</span>
            <span class="controle-problema-badge"><span class="material-symbols-outlined">${problemaInfo.icon}</span>${problemaInfo.label}</span>
            <span>${dados.descricao}</span>
            <span class="registros-data">${formatarDataHoraAtual()}</span>
            <span class="registros-row-menu-wrap">
                <button type="button" class="registros-row-menu-btn" aria-label="Mais opções">
                    <span class="material-symbols-outlined">more_vert</span>
                </button>
                <div class="registros-row-menu">
                    <span class="registros-row-menu-opcao" data-acao="editar">Editar</span>
                    <span class="registros-row-menu-opcao registros-row-menu-opcao-danger" data-acao="excluir">Excluir</span>
                </div>
            </span>
        `;

        tabContent.appendChild(row);
        atualizarContagem(tipo);

        if (tabContent.classList.contains('active')) atualizarPaginacaoTexto(tabContent);
    }

    function atualizarContagem(tipo) {
        const contadorEl = document.getElementById(`contagem-${tipo}`);
        const tabContent = document.getElementById(`tab-${tipo}`);
        if (contadorEl && tabContent) {
            contadorEl.textContent = tabContent.querySelectorAll('.registros-row').length;
        }
    }

    /* ===== Seleção de linha + toolbar ===== */
    registrosContainer.addEventListener('click', (e) => {
        const menuBtn = e.target.closest('.registros-row-menu-btn');
        if (menuBtn) {
            e.stopPropagation();
            const menu = menuBtn.nextElementSibling;
            const jaAberto = menu.classList.contains('active');
            fecharTodosMenus();
            if (!jaAberto) menu.classList.add('active');
            return;
        }

        const opcaoMenu = e.target.closest('.registros-row-menu-opcao');
        if (opcaoMenu) {
            const row = opcaoMenu.closest('.registros-row');
            if (opcaoMenu.dataset.acao === 'excluir') {
                removerLinha(row);
            } else {
                selecionarLinha(row);
                console.log('Editar registro:', row.dataset.id);
            }
            fecharTodosMenus();
            return;
        }

        const row = e.target.closest('.registros-row');
        if (!row) return;

        if (linhaSelecionada === row) {
            limparSelecao();
            return;
        }

        selecionarLinha(row);
    });

    function fecharTodosMenus(exceto = null) {
        document.querySelectorAll('.registros-row-menu.active').forEach((menu) => {
            if (menu !== exceto) menu.classList.remove('active');
        });
    }

    function selecionarLinha(row) {
        if (linhaSelecionada) linhaSelecionada.classList.remove('selected');
        linhaSelecionada = row;
        row.classList.add('selected');
        atualizarToolbar();
    }

    function limparSelecao() {
        if (linhaSelecionada) linhaSelecionada.classList.remove('selected');
        linhaSelecionada = null;
        atualizarToolbar();
    }

    function atualizarToolbar() {
        const temSelecao = linhaSelecionada !== null;
        if (btnEditar) btnEditar.disabled = !temSelecao;
        if (btnDeletar) btnDeletar.disabled = !temSelecao;
    }

    function removerLinha(row) {
        const tabContent = row.closest('.controle-tab-content');
        const tipo = tabContent ? tabContent.dataset.tipo : null;

        if (row === linhaSelecionada) limparSelecao();
        row.remove();

        if (tipo && ICONE_POR_TIPO[tipo]) atualizarContagem(tipo);
        if (tabContent && tabContent.classList.contains('active')) atualizarPaginacaoTexto(tabContent);
    }

    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            if (!linhaSelecionada) return;
            console.log('Editar registro:', linhaSelecionada.dataset.id);
        });
    }

    if (btnDeletar) {
        btnDeletar.addEventListener('click', () => {
            if (!linhaSelecionada) return;
            removerLinha(linhaSelecionada);
        });
    }

    /* ===== Inicialização ===== */
    ['observacao', 'manutencao', 'quebrado'].forEach(atualizarContagem);
    atualizarPaginacaoTexto(document.getElementById('tab-observacao'));
}

function formatarDataHoraAtual() {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${data} ${hora}`;
}