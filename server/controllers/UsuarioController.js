import crypto from 'crypto';
import UsuarioRepository from '../repositories/UsuarioRepository.js';

class UsuarioController {
    async listar(req, res) {
        try { 
            const usuarios = await UsuarioRepository.listarTodos();
            return res.json(usuarios); 
        } catch (err) { 
            console.error('Erro ao listar utilizadores:', err.message);
            res.status(500).json({ erro: 'Erro ao listar utilizadores no banco.' }); 
        }
    }

    async cadastrar(req, res) {
        const { usuario, nome, senha, role, usuario_pdv } = req.body;
        if (!usuario || !nome || !senha || !role) {
            return res.status(400).json({ erro: 'Os campos Usuário, Nome, Senha e Perfil são obrigatórios.' });
        }

        // Adquire conexão dedicada para iniciar a transação de isolamento
        const client = await UsuarioRepository.getClient();
        try {
            await client.query('BEGIN'); // 🔒 Início do bloco transacional estrito

            const existe = await UsuarioRepository.verificarSeLoginExiste(usuario, client);
            if (existe) {
                await client.query('ROLLBACK');
                return res.status(400).json({ erro: 'Este nome de utilizador já está a ser utilizado.' });
            }

            const hash = crypto.createHash('sha256').update(senha).digest('hex');
            await UsuarioRepository.criar({ usuario, nome, role, usuario_pdv }, hash, client);
            
            await client.query('COMMIT'); // 🔓 Confirma a gravação com segurança máxima
            return res.json({ sucesso: true, mensagem: 'Utilizador cadastrado com sucesso!' });
        } catch (err) { 
            await client.query('ROLLBACK'); // 🚨 Cancela a operação se houver erro técnico
            console.error('Erro transacional ao cadastrar utilizador:', err.message);
            res.status(500).json({ erro: 'Erro interno ao salvar novo utilizador.' }); 
        } finally {
            client.release(); // 🔒 Devolve a conexão ao pool preventivamente
        }
    }

    async atualizarFlag(req, res) {
        const { id } = req.params;
        const { campo, valor } = req.body;
        
        // 🔒 BLINDAGEM ANTI INJEÇÃO SQL: Lista branca estrita de colunas permitidas
        if (!['bloqueado', 'usuario_pdv', 'trocar_senha_prox_login'].includes(campo)) {
            return res.status(400).json({ erro: 'Ação não permitida para esta propriedade.' });
        }

        try {
            await UsuarioRepository.atualizarFlag(id, campo, valor);
            return res.json({ sucesso: true, mensagem: 'Status atualizado com sucesso!' });
        } catch (err) { 
            console.error('Erro ao atualizar flag de utilizador:', err.message);
            res.status(500).json({ erro: 'Erro ao salvar alteração.' }); 
        }
    }

    async deletar(req, res) {
        try { 
            await UsuarioRepository.softDelete(req.params.id); 
            return res.json({ sucesso: true, mensagem: 'Utilizador removido com sucesso.' }); 
        } catch (err) { 
            console.error('Erro ao remover utilizador:', err.message);
            res.status(500).json({ erro: 'Erro interno ao processar a exclusão.' }); 
        }
    }
}

export default new UsuarioController();