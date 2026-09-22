// src/services/CrediarioService.js
import { request } from './api'; // 🌟 Importa apenas o request

/**
 * Recupera o ID da empresa ativa que está selecionada no sistema.
 */
function obterEmpresaIdAtivo() {
    const filialAtiva = localStorage.getItem('filialAtiva') || localStorage.getItem('empresaAtiva');
    if (filialAtiva) {
        try {
            const obj = JSON.parse(filialAtiva);
            if (obj.empresa_id) return obj.empresa_id;
            if (obj.id) return obj.id;
        } catch (e) {
            if (filialAtiva !== 'undefined' && filialAtiva !== 'null') return filialAtiva;
        }
    }

    const empresaId = localStorage.getItem('empresaId') || 
                      localStorage.getItem('tenantId') ||
                      JSON.parse(localStorage.getItem('user') || '{}')?.empresa_id;

    return (empresaId && empresaId !== 'undefined' && empresaId !== 'null') ? empresaId : '';
}

/**
 * Monta os cabeçalhos de autenticação padrão
 */
function obterHeadersAutenticados() {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('@App:token') || 
                  JSON.parse(localStorage.getItem('user') || '{}')?.token;

    const headers = {};

    if (token) {
        const tokenLimpo = token.replace(/"/g, '');
        headers['Authorization'] = `Bearer ${tokenLimpo}`;
    }

    return headers;
}

const CrediarioService = {
    /**
     * Busca os dados da ficha de crediário
     */
    async buscarExtrato(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            throw new Error('O termo de busca é obrigatório.');
        }
        
        try {
            const termoCodificado = encodeURIComponent(termoBusca.trim());
            const headers = obterHeadersAutenticados();
            const empresaId = obterEmpresaIdAtivo();

            const resposta = await request(`/api/crediario/extrato?busca=${termoCodificado}&empresaId=${empresaId}`, {
                method: 'GET',
                headers: headers
            });
            
            return resposta;
        } catch (error) {
            throw new Error(error.message || 'Erro ao conectar ao servidor de crediário.');
        }
    },

    /**
     * Processa a baixa em lote das parcelas
     */
    async processarBaixaTulos(payload) {
        if (!payload.parcelasIds || payload.parcelasIds.length === 0) {
            throw new Error('Nenhuma parcela foi selecionada para recebimento.');
        }

        try {
            const headers = obterHeadersAutenticados();

            const resposta = await request(`/api/crediario/baixar`, {
                method: 'POST',
                headers: headers,
                body: payload
            });
            
            return resposta;
        } catch (error) {
            throw new Error(error.message || 'Falha crítica ao registrar baixa do crediário.');
        }
    }
};

export default CrediarioService;