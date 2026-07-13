import { request } from './api';

class ClienteService {
    async listar(busca = '') {
        const url = busca ? `/api/clientes?busca=${encodeURIComponent(busca)}` : '/api/clientes';
        return request(url, { method: 'GET' });
    }

    async salvar(cliente, id = null) {
        const url = id ? `/api/clientes/${id}` : '/api/clientes';
        const method = id ? 'PUT' : 'POST';
        return request(url, {
            method,
            body: JSON.stringify(cliente)
        });
    }

    async excluir(id) {
        return request(`/api/clientes/${id}`, { method: 'DELETE' });
    }

    async consultarCep(cep) {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) return null;
        
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await res.json();
        return dados.erro ? null : dados;
    }
}

export default new ClienteService();