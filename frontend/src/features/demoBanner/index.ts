import { renderDemoBanner } from './templates.js';
import { inserirBanner, attachFecharBanner } from './render.js';

export function initDemoBanner(): void {
    if (sessionStorage.getItem('eduassets_demo_banner_fechado') === 'true') return;

    const login = import.meta.env.VITE_DEMO_LOGIN || 'admin@eduassets.com';
    const senha = import.meta.env.VITE_DEMO_SENHA || '';

    inserirBanner(renderDemoBanner(login, senha));
    attachFecharBanner();
}