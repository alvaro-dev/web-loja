// src/services/CrediarioService.js
import { request } from './api.js'; // 🌟 Importa o 'request' correto do seu projeto

class CrediarioService {
    /**
     * Busca os dados da ficha de crediário de um cliente específico pelo Nome ou CPF
     */
    async buscarExtrato(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            throw new Error('O termo de busca é obrigatório.');
        }
        
        try {
            const termoCodificado = encodeURIComponent(termoBusca.trim());
            const resposta = await request(`/api/crediario/extrato?busca=${termoCodificado}`, {
                method: 'GET'
            });
            
            return resposta.data || resposta;
        } catch (error) {
            const mensagem = error.response?.data?.erro || error.message || 'Erro ao conectar ao servidor de crediário.';
            throw new Error(mensagem);
        }
    }
    
    /**
     * Processa a baixa em lote de uma ou mais parcelas do crediário do cliente
     */
    async processarBaixaTulos(payload) {
        if (!payload.parcelasIds || payload.parcelasIds.length === 0) {
            throw new Error('Nenhuma parcela foi selecionada para recebimento.');
        }

        try {
            // 🌟 CORRIGIDO: Usa 'request' com o método POST e repassa o payload no body (data)
            const resposta = await request(`/api/crediario/baixar`, {
                method: 'POST',
                data: payload
            });
            
            return resposta.data || resposta;
        } catch (error) {
            const mensagem = error.response?.data?.erro || error.message || 'Falha crítica ao registrar baixa do crediário.';
            throw new Error(mensagem);
        }
    }
}

export default new CrediarioService();