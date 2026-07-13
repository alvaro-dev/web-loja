import { request } from './api';

class AuthService {
    async login(usuario, senha) {
        return request('/api/login', {
            method: 'POST',
            body: JSON.stringify({ usuario, senha })
        });
    }

    async alterarSenha(usuarioId, senhaAntiga, novaSenha) {
        return request('/api/alterar-senha', {
            method: 'POST',
            body: JSON.stringify({ usuarioId, senhaAntiga, novaSenha })
        });
    }
}

export default new AuthService();