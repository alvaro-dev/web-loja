import { request } from './api';

class ConfigService {
    async listarEmpresas() {
        return request('/api/crud-empresas', { method: 'GET' });
    }

    async salvarEmpresa(empresa) {
        return request('/api/crud-empresas', {
            method: 'POST',
            body: JSON.stringify(empresa)
        });
    }

    async alternarFlagEmpresa(id, campo, valor) {
        return request(`/api/crud-empresas/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ campo, valor })
        });
    }

    async listarFiliais() {
        return request('/api/crud-filiais', { method: 'GET' });
    }

    async salvarFilial(filial) {
        return request('/api/crud-filiais', {
            method: 'POST',
            body: JSON.stringify(filial)
        });
    }

    async alternarFlagFilial(id, campo, valor) {
        return request(`/api/crud-filiais/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ campo, valor })
        });
    }

    async listarMenusACL() {
        return request('/api/gerenciar-menus', { method: 'GET' });
    }

    async salvarMenuACL(menu) {
        return request('/api/gerenciar-menus', {
            method: 'POST',
            body: JSON.stringify(menu)
        });
    }

    async alternarFlagMenu(id, campo, valor) {
        return request(`/api/gerenciar-menus/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ campo, valor })
        });
    }

    async obterMatrizPermissoes() {
        return request('/api/gerenciar-permissoes', { method: 'GET' });
    }

    async alternarPermissaoACL(role, menuId, concedido) {
        return request('/api/gerenciar-permissoes/alternar', {
            method: 'POST',
            body: JSON.stringify({ role, menuId, concedido })
        });
    }

    async listarEscoposTabelas() {
        return request('/api/tabelas-escopo', { method: 'GET' });
    }

    async alterarEscopoTabela(tabelaNome, escopo) {
        return request(`/api/tabelas-escopo/${tabelaNome}`, {
            method: 'PUT',
            body: JSON.stringify({ escopo })
        });
    }

    async carregarRelatorioRecebiveis(dataInicio, dataFim) {
        return request(`/api/relatorio-recebiveis?dataInicio=${dataInicio}&dataFim=${dataFim}`, { method: 'GET' });
    }
}

export default new ConfigService();