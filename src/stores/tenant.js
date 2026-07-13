import { defineStore } from 'pinia';
import { tenantHeaders } from '@/services/api';

export const useTenantStore = defineStore('tenant', {
    state: () => ({
        empresaAtivaId: '',
        filialAtivaId: '',
        listaAcessosBrutos: []
    }),
    
    getters: {
        // Filtra e unifica as empresas únicas reativamente a partir dos acessos brutos
        listaEmpresasDisponiveis(state) {
            const mapeado = state.listaAcessosBrutos.map(a => ({ id: a.empresa_id, nome: a.empresa_nome }));
            return mapeado.filter((value, index, self) => self.findIndex(t => t.id === value.id) === index);
        },
        
        // Filtra as filiais correspondentes à empresa selecionada
        listaFiliaisFiltradas(state) {
            return state.listaAcessosBrutos
                .filter(a => a.empresa_id === state.empresaAtivaId)
                .map(a => ({ id: a.filial_id, nome: a.filial_nome }));
        }
    },
    
    actions: {
        setAcessos(acessos) {
            this.listaAcessosBrutos = acessos;
            
            // Define o acesso padrão ou recua para o primeiro da fila
            const acessoPadrao = acessos.find(a => a.padrao) || acessos[0];
            if (acessoPadrao) {
                this.setEmpresa(acessoPadrao.empresa_id);
                this.setFilial(acessoPadrao.filial_id);
            }
        },
        
        setEmpresa(id) {
            this.empresaAtivaId = id;
            tenantHeaders.empresaId = id; // Sincroniza em tempo real com o interceptor da API
            
            // Auto-seleciona a primeira filial disponível do novo escopo filtrado
            const filiais = this.listaFiliaisFiltradas;
            if (filiais.length > 0 && !filiais.some(f => f.id === this.filialAtivaId)) {
                this.setFilial(filiais[0].id);
            }
        },
        
        setFilial(id) {
            this.filialAtivaId = id;
            tenantHeaders.filialId = id; // Sincroniza em tempo real com o interceptor da API
        },
        
        limparTenant() {
            this.empresaAtivaId = '';
            this.filialAtivaId = '';
            this.listaAcessosBrutos = [];
            tenantHeaders.empresaId = '';
            tenantHeaders.filialId = '';
        }
    }
});