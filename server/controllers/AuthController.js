import crypto from 'crypto';
import UsuarioRepository from '../repositories/UsuarioRepository.js';

function gerarHashSenha(senha) {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

class AuthController {
    async login(req, res) {
        const { usuario, senha } = req.body;
        if (!usuario || !senha) {
            return res.status(400).json({ erro: 'Usuário e senha são obrigatórios.' });
        }

        try {
            const senhaHash = gerarHashSenha(senha);
            const user = await UsuarioRepository.buscarPorLoginESenha(usuario, senhaHash);
            if (!user) {
                return res.status(401).json({ erro: 'Usuário ou senha inválidos, ou conta bloqueada.' });
            }

            // 🌟 CORRIGIDO LITERALMENTE: Alinhado estritamente com o UsuarioRepository.js
            const menus = await UsuarioRepository.obterMenusPorRole(user.role);
            const acessos = await UsuarioRepository.obterAcessosMultiTenant(user.id);

            if (acessos.length === 0) {
                return res.status(403).json({ erro: 'Este usuário não possui nenhuma filial ou empresa vinculada ao seu acesso.' });
            }

            return res.json({
                sucesso: true,
                mensagem: 'Login realizado com sucesso!',
                usuario: { 
                    id: user.id, 
                    usuario: user.usuario, 
                    nome: user.nome, // 🌟 CORRIGIDO: de 'name' para 'nome' para casar com o Vue (usuarioLogado?.nome)
                    role: user.role, 
                    trocarSenha: user.trocar_senha_prox_login === 'S' 
                },
                menus, // Envia o array de menus preenchido
                acessos
            });
        } catch (err) {
            console.error('Erro na rota transacional de login:', err.message);
            return res.status(500).json({ erro: 'Erro interno no servidor de banco de dados.' });
        }
    }

    async alterarSenha(req, res) {
        const { usuarioId, senhaAntiga, novaSenha } = req.body;
        try {
            if (!(await UsuarioRepository.verificarSenhaAntiga(usuarioId, gerarHashSenha(senhaAntiga)))) {
                return res.status(401).json({ erro: 'A senha antiga informada está incorreta.' });
            }
            await UsuarioRepository.atualizarSenha(usuarioId, gerarHashSenha(novaSenha));
            return res.json({ sucesso: true, mensagem: 'Senha updated!' });
        } catch (err) {
            console.error('Erro transacional ao alterar senha:', err.message);
            return res.status(500).json({ erro: 'Erro interno ao salvar a nova senha.' });
        }
    }
}

export default new AuthController();