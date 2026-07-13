import { request } from './api';

class UsuarioService {
    async listarUsuarios() {
        return request('/api/usuarios', { method: 'GET' });
    }

    async cadastrarUsuario(dadosUsuario) {
        return request('/api/usuarios', {
            method: 'POST',
            body: JSON.stringify(dadosUsuario)
        });
    }

    async alternarFlag(id, campo, valor) {
        return request(`/api/usuarios/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ campo, valor })
        });
    }

    async excluir(id) {
        return request(`/api/usuarios/${id}`, { method: 'DELETE' });
    }

    async listarAcessosUsuarios() {
        return request('/api/crud-usuarios-acessos', { method: 'GET' });
    }

    async vincularAcesso(payload) {
        return request('/api/crud-usuarios-acessos', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async revogarAcesso(id) {
        return request(`/api/crud-usuarios-acessos/${id}`, { method: 'DELETE' });
    }
}

export default new UsuarioService();