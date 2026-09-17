export function inserirBanner(html: string): void {
    const container = document.querySelector('.app-container');
    if (!container) return;
    container.insertAdjacentHTML('afterbegin', html);
}

export function attachFecharBanner(): void {
    document.getElementById('demo-banner-fechar')?.addEventListener('click', () => {
        document.getElementById('demo-banner')?.remove();
        sessionStorage.setItem('eduassets_demo_banner_fechado', 'true');
    });
}