import { html } from '../../core/utils/html.js';

export function renderDemoBanner(loginDemo: string, senhaDemo: string): string {
    return html`
        <div class="demo-banner" id="demo-banner">
            <span class="material-symbols-outlined">science</span>
            <div class="demo-banner-texto">
                <strong>Ambiente de demonstração</strong>
                <span>Este é o portfólio online do eduAssets. Explore em Modo Convidado ou entre com:
                    <code>${loginDemo}</code> / <code>${senhaDemo}</code>
                </span>
            </div>
            <button type="button" class="demo-banner-fechar" id="demo-banner-fechar" aria-label="Fechar aviso">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
    `;
}