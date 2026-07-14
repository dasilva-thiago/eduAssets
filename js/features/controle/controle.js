export function initControle() {
    const registrosContainer = document.querySelector('.controle-registros-container');
    if (!registrosContainer) return;

    const btnNovo = document.getElementById('btn-novo-registro');
    const menuNovo = document.getElementById('novo-registro-menu');
    const btnEditar = document.getElementById('btn-editar-registro');
    const btnDeletar = document.getElementById('btn-deletar-registro');

    let linhaSelecionada = null;

    /* ===== Tabs: Observação | Manutenção | Quebrado | Resolvidos ===== */
    document.querySelectorAll('.controle-tab-link').forEach((tabLink) => {
        tabLink.addEventListener('click', () => {
            document.querySelectorAll('.controle-tab-link').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.controle-tab-content').forEach(c => c.classList.remove('active'));

            tabLink.classList.add('active');
            const targetTab = document.getElementById(`tab-${tabLink.dataset.controleTab}`);
            if (targetTab) targetTab.classList.add('active');

            limparSelecao();
        });
    });

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

        document.addEventListener('click', (e) => {
            if (!menuNovo.contains(e.target) && e.target !== btnNovo) {
                menuNovo.classList.remove('active');
            }
        });
    }

    function abrirNovoRegistro(tipo) {
        console.log('Novo registro:', tipo);
    }

    registrosContainer.addEventListener('click', (e) => {
        const row = e.target.closest('.registros-row');
        if (!row) return;

        if (linhaSelecionada === row) {
            limparSelecao();
            return;
        }

        selecionarLinha(row);
    });

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

    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            if (!linhaSelecionada) return;
            console.log('Editar registro:', linhaSelecionada.dataset.id);
        });
    }

    if (btnDeletar) {
        btnDeletar.addEventListener('click', () => {
            if (!linhaSelecionada) return;
            linhaSelecionada.remove();
            limparSelecao();
        });
    }
}