import { defineStore } from 'pinia';
import { useTenantStore } from './tenant';
import { tenantHeaders } from '@/services/api'; // 🌟 Importado

export const useAuthStore = defineStore('auth', {
    state: () => ({
        usuarioLogado: null,
        listaMenus: [],
        sistemaLiberado: false
    }),
    
    actions: {
        definirSessao(dadosLogin) {
            this.usuarioLogado = dadosLogin.usuario;
            this.listaMenus = dadosLogin.menus;
            this.sistemaLiberado = true;

            // 🌟 Injeta o ID do operador para o interceptor do api.js
            if (dadosLogin.usuario?.id) {
                tenantHeaders.usuarioId = dadosLogin.usuario.id;
                localStorage.setItem('usuarioId', dadosLogin.usuario.id);
                localStorage.setItem('user', JSON.stringify(dadosLogin.usuario));
            }

            const tenantStore = useTenantStore();
            tenantStore.setAcessos(dadosLogin.acessos);
        },
        
        limparSessao() {
            this.usuarioLogado = null;
            this.listaMenus = [];
            this.sistemaLiberado = false;
            
            tenantHeaders.usuarioId = '';
            localStorage.removeItem('usuarioId');
            localStorage.removeItem('user');

            const tenantStore = useTenantStore();
            tenantStore.limparTenant();
        }
    }
});