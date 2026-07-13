import { request } from './api';

class CaixaService {
    async listarCaixas() {
        return request('/api/crud-caixas', { method: 'GET' });
    }

    async cadastrarCaixa(dadosCaixa) {
        return request('/api/crud-caixas', {
            method: 'POST',
            body: JSON.stringify(dadosCaixa)
        });
    }

    async alternarStatus(id, valor) {
        return request(`/api/crud-caixas/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ campo: 'ativo', valor })
        });
    }

    async carregarAcompanhamento(dataFiltro) {
        return request(`/api/acompanhamento-caixas?dataFiltro=${dataFiltro}`, { method: 'GET' });
    }

    async obterExtratoTurno(caixaId, dataAbertura, dataFechamento) {
        const query = new URLSearchParams({ caixaId, dataAbertura, dataFechamento });
        return request(`/api/obter-vendas-periodo?${query}`, { method: 'GET' });
    }
}

export default new CaixaService();