import { request } from './api';

class CrediarioService {
    /**
     * Busca os dados da ficha de crediário de um cliente específico pelo Nome ou CPF
     * Retorna os dados resumidos do cliente e a lista de parcelas na tabela 'contas_a_receber'
     */
    async buscarExtrato(termoBusca) {
        if (!termoBusca || !termoBusca.trim()) {
            throw new Error('O termo de busca é obrigatório.');
        }
        
        try {
            const resposta = await api.get(`/api/crediario/extrato`, {
                params: { busca: termoBusca.trim() }
            });
            return resposta.data;
        } catch (error) {
            const mensagem = error.response?.data?.erro || 'Erro ao conectar ao servidor de crediário.';
            throw new Error(mensagem);
        }
    }

    /**
     * Processa a baixa em lote de uma ou mais parcelas do crediário do cliente
     * Envia os IDs das parcelas selecionadas e o meio de pagamento (DN, PX, CD)
     */
    async processarBaixaTulos(payload) {
        // payload esperado: { clienteId: string, parcelasIds: Array, formaPagamento: string }
        if (!payload.parcelasIds || payload.parcelasIds.length === 0) {
            throw new Error('Nenhuma parcela foi selecionada para recebimento.');
        }

        try {
            const resposta = await api.post(`/api/crediario/baixar`, payload);
            return resposta.data;
        } catch (error) {
            const mensagem = error.response?.data?.erro || 'Falha crítica ao registrar baixa do crediário.';
            throw new Error(mensagem);
        }
    }
}

export default new CrediarioService();