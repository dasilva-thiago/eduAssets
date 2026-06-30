document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const panels = document.querySelectorAll('.panel');

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 

            const targetId = link.dataset.panel; 

            // Oculta todos os painéis
            panels.forEach(panel => panel.classList.remove('active'));

            // Mostra só o painel certo
            document.getElementById(targetId).classList.add('active');

            // Atualiza qual link está marcado como ativo no menu
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
});