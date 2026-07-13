import { defineStore } from 'pinia';
import { useTenantStore } from './tenant';

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

            // Alimenta a store vizinha de Tenant de forma atômica
            const tenantStore = useTenantStore();
            tenantStore.setAcessos(dadosLogin.acessos);
        },
        
        limparSessao() {
            this.usuarioLogado = null;
            this.listaMenus = [];
            this.sistemaLiberado = false;

            const tenantStore = useTenantStore();
            tenantStore.limparTenant();
        }
    }
});