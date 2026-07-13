import ConfigRepository from '../repositories/ConfigRepository.js';
import pool from '../config/database.js';

class ConfigController {
    async listarEmpresas(req, res) {
        try { return res.json(await ConfigRepository.listarEmpresas()); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async cadastrarEmpresa(req, res) {
        const { razao_social, nome_fantasia, cnpj } = req.body;
        if (!razao_social || !nome_fantasia) return res.status(400).json({ erro: 'Dados obrigatórios ausentes.' });
        
        const client = await ConfigRepository.getClient();
        try { 
            await client.query('BEGIN');
            await ConfigRepository.criarEmpresa(razao_social, nome_fantasia, cnpj, client); 
            await client.query('COMMIT');
            return res.json({ sucesso: true, mensagem: 'Empresa cadastrada com sucesso!' }); 
        } catch (err) { 
            await client.query('ROLLBACK');
            res.status(500).json({ erro: err.message }); 
        } finally { client.release(); }
    }

    async patchEmpresa(req, res) {
        const { id } = req.params; const { campo, valor } = req.body;
        if (!['ativo', 'deletado'].includes(campo)) return res.status(400).json({ erro: 'Ação inválida.' });
        try { await ConfigRepository.atualizarFlagEmpresa(id, campo, valor); return res.json({ sucesso: true }); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async listarFiliais(req, res) {
        try { return res.json(await ConfigRepository.listarFiliais()); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async cadastrarFilial(req, res) {
        const client = await ConfigRepository.getClient();
        try { 
            await client.query('BEGIN');
            await ConfigRepository.criarFilial(req.body, client); 
            await client.query('COMMIT');
            return res.json({ sucesso: true, mensagem: 'Filial cadastrada com sucesso!' }); 
        } catch (err) { 
            await client.query('ROLLBACK');
            res.status(500).json({ erro: err.message }); 
        } finally { client.release(); }
    }

    async patchFilial(req, res) {
        const { id } = req.params; const { campo, valor } = req.body;
        if (!['ativo', 'deletado'].includes(campo)) return res.status(400).json({ erro: 'Ação inválida.' });
        try { await ConfigRepository.atualizarFlagFilial(id, campo, valor); return res.json({ sucesso: true }); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async listarAcessosPivo(req, res) {
        try { return res.json(await ConfigRepository.listarAcessosUsuariosPivo()); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async vincularAcesso(req, res) {
        const { usuario_id, empresa_id, filial_id, padrao } = req.body;
        
        const client = await ConfigRepository.getClient();
        try {
            await client.query('BEGIN'); // 🔒 Bloqueia as tabelas pivo de acessos

            let padraoFinal = padrao;
            if (padrao) {
                await ConfigRepository.limparPadraoAntigo(usuario_id, client);
            } else if (await ConfigRepository.checarPrimeiroAcesso(usuario_id, client)) {
                padraoFinal = true; // Força padrão se for o primeiro vínculo do operador
            }

            await ConfigRepository.vincularAcessoUsuario({ usuario_id, empresa_id, filial_id }, padraoFinal, client);
            
            await client.query('COMMIT');
            return res.json({ sucesso: true, mensagem: 'Acesso vinculado com sucesso!' });
        } catch (err) { 
            await client.query('ROLLBACK');
            res.status(500).json({ erro: err.message }); 
        } finally { client.release(); }
    }

    async revogarAcesso(req, res) {
        const client = await ConfigRepository.getClient();
        try {
            await client.query('BEGIN');

            const status = await ConfigRepository.obterStatusAcesso(req.params.id, client);
            if (status && status.padrao) {
                await client.query('ROLLBACK');
                return res.status(400).json({ erro: 'Não é possível remover o acesso marcado como padrão.' });
            }

            await ConfigRepository.revogarAcessoUsuario(req.params.id, client); 
            
            await client.query('COMMIT');
            return res.json({ sucesso: true, mensagem: 'Acesso revogado com sucesso!' });
        } catch (err) { 
            await client.query('ROLLBACK');
            res.status(500).json({ erro: err.message }); 
        } finally { client.release(); }
    }

    async listarMenus(req, res) {
        try { return res.json(await ConfigRepository.listarTodosMenusACL()); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async cadastrarMenu(req, res) {
        const client = await ConfigRepository.getClient();
        try {
            await client.query('BEGIN');

            if (await ConfigRepository.verificarRotaMenuExiste(req.body.rota, client)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ erro: 'Esta rota já está ativa no dicionário de menus.' });
            }

            await ConfigRepository.criarMenuACL(req.body, client); 
            
            await client.query('COMMIT');
            return res.json({ sucesso: true, mensagem: 'Menu criado com sucesso!' }); 
        } catch (err) { 
            await client.query('ROLLBACK');
            res.status(500).json({ erro: err.message }); 
        } finally { client.release(); }
    }

    async patchMenu(req, res) {
        try { await ConfigRepository.atualizarFlagMenu(req.params.id, req.body.campo, req.body.valor); return res.json({ sucesso: true }); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async listarPermissoes(req, res) {
        try { return res.json(await ConfigRepository.listarMatrizPermissoes()); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async alternarPermissao(req, res) {
        const { role, menuId, concedido } = req.body;
        const client = await ConfigRepository.getClient();
        try {
            await client.query('BEGIN');
            if (concedido) await ConfigRepository.concederPermissaoACL(role, menuId, client);
            else await ConfigRepository.revogarPermissaoACL(role, menuId, client);
            await client.query('COMMIT');
            return res.json({ sucesso: true });
        } catch (err) { 
            await client.query('ROLLBACK');
            res.status(500).json({ erro: err.message }); 
        } finally { client.release(); }
    }

    async listarEscopos(req, res) {
        try { return res.json(await ConfigRepository.listarEscoposTabelas()); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async atualizarEscopo(req, res) {
        try { await ConfigRepository.atualizarEscopoTabela(req.params.tabela_nome, req.body.escopo); return res.json({ sucesso: true }); } catch (err) { res.status(500).json({ erro: err.message }); }
    }

    async relatorioRecebiveis(req, res) {
        const { x_empresa_id, x_filial_id } = req.headers; const { dataInicio, dataFim } = req.query;
        if (!x_empresa_id || !x_filial_id) return res.status(400).json({ erro: 'Faltam dados estruturais de cabeçalho.' });
        
        const client1 = await pool.connect();
        const client2 = await pool.connect();
        try {
            const limites = [`${dataInicio} 00:00:00`, `${dataFim} 23:59:59`];
            const queries = await ConfigRepository.obterDadosRelatorioRecebiveis(x_empresa_id, x_filial_id, limites[0], limites[1]);
            const [resumo, extrato] = await Promise.all([
                client1.query(queries.queryResumo, [x_empresa_id, x_filial_id, limites[0], limites[1]]),
                client2.query(queries.queryExtrato, [x_empresa_id, x_filial_id, limites[0], limites[1]])
            ]);
            return res.json({ resumoBandeiras: resumo.rows, extratoParcelas: extrato.rows });
        } catch (err) { res.status(500).json({ erro: err.message }); } finally { client1.release(); client2.release(); }
    }
}

export default new ConfigController();