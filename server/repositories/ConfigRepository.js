import pool from '../config/database.js';

class ConfigRepository {
    async getClient() {
        return await pool.connect();
    }

    async listarEmpresas() {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT id, razao_social, nome_fantasia, cnpj, ativo FROM empresas WHERE deletado = false ORDER BY nome_fantasia ASC');
            return res.rows;
        } finally {
            client.release();
        }
    }

    async criarEmpresa(razao_social, nome_fantasia, cnpj, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query('INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, ativo, deletado) VALUES (gen_random_uuid(), $1, $2, $3, true, false)', [razao_social, nome_fantasia, cnpj]);
    }

    async atualizarFlagEmpresa(id, campo, valor) {
        const client = await pool.connect();
        try {
            await client.query(`UPDATE empresas SET ${campo} = $1 WHERE id = $2`, [valor, id]);
        } finally {
            client.release();
        }
    }

    async listarFiliais() {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT f.id, f.empresa_id, f.nome, f.cnpj, f.cidade, f.estado, f.ativo, e.nome_fantasia AS empresa_nome
                FROM filiais f
                INNER JOIN empresas e ON e.id = f.empresa_id
                WHERE f.deletado = false
                ORDER BY e.nome_fantasia ASC, f.nome ASC
            `);
            return res.rows;
        } finally {
            client.release();
        }
    }

    async criarFilial(f, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query('INSERT INTO filiais (id, empresa_id, nome, cnpj, cidade, estado, ativo, deletado) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, false)', [f.empresa_id, f.nome, f.cnpj, f.cidade, f.estado]);
    }

    async atualizarFlagFilial(id, campo, valor) {
        const client = await pool.connect();
        try {
            await client.query(`UPDATE filiais SET ${campo} = $1 WHERE id = $2`, [valor, id]);
        } finally {
            client.release();
        }
    }

    async listarAcessosUsuariosPivo() {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT ua.id, ua.usuario_id, ua.empresa_id, ua.filial_id, ua.padrao,
                       u.nome AS usuario_nome, u.usuario AS usuario_login, e.nome_fantasia AS empresa_nome, f.nome AS filial_nome
                FROM usuarios_acessos ua
                INNER JOIN usuarios u ON u.id = ua.usuario_id
                INNER JOIN empresas e ON e.id = ua.empresa_id
                INNER JOIN filiais f ON f.id = ua.filial_id
                WHERE u.deletado = false AND e.deletado = false AND f.deletado = false
                ORDER BY u.nome ASC, e.nome_fantasia ASC, f.nome ASC
            `);
            return res.rows;
        } finally {
            client.release();
        }
    }

    // Suporta verificação atômica dentro de transações de vínculo
    async checarPrimeiroAcesso(usuarioId, clientExterno = null) {
        const executor = clientExterno || pool;
        const res = await executor.query('SELECT id FROM usuarios_acessos WHERE usuario_id = $1', [usuarioId]);
        return res.rows.length === 0;
    }

    async limparPadraoAntigo(usuarioId, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query('UPDATE usuarios_acessos SET padrao = false WHERE usuario_id = $1', [usuarioId]);
    }

    async vincularAcessoUsuario(ua, padraoFinal, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query(`
            INSERT INTO usuarios_acessos (id, usuario_id, empresa_id, filial_id, padrao)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
            ON CONFLICT (usuario_id, empresa_id, filial_id) DO UPDATE SET padrao = EXCLUDED.padrao
        `, [ua.usuario_id, ua.empresa_id, ua.filial_id, padraoFinal]);
    }

    async obterStatusAcesso(id, clientExterno = null) {
        const executor = clientExterno || pool;
        const res = await executor.query('SELECT padrao, usuario_id FROM usuarios_acessos WHERE id = $1', [id]);
        return res.rows.length > 0 ? res.rows[0] : null;
    }

    async revogarAcessoUsuario(id, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query('DELETE FROM usuarios_acessos WHERE id = $1', [id]);
    }

    async listarTodosMenusACL() {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT id, titulo, rota, icone, ordem, ativo, deletado FROM menus ORDER BY deletado ASC, ordem ASC');
            return res.rows;
        } finally {
            client.release();
        }
    }

    async verificarRotaMenuExiste(rota, clientExterno = null) {
        const executor = clientExterno || pool;
        const res = await executor.query('SELECT id FROM menus WHERE rota = $1 AND deletado = false', [rota]);
        return res.rows.length > 0;
    }

    async criarMenuACL(m, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query('INSERT INTO menus (id, titulo, rota, icone, ordem, ativo, deletado) VALUES (gen_random_uuid(), $1, $2, $3, $4 || 0, true, false)', [m.titulo, m.rota, m.icone, m.ordem]);
    }

    async atualizarFlagMenu(id, campo, valor) {
        const client = await pool.connect();
        try {
            await client.query(`UPDATE menus SET ${campo} = $1 WHERE id = $2`, [valor, id]);
        } finally {
            client.release();
        }
    }

    async listarMatrizPermissoes() {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT pm.id, pm.role, pm.menu_id FROM permissoes_menu pm INNER JOIN menus m ON m.id = pm.menu_id WHERE m.deletado = false');
            return res.rows;
        } finally {
            client.release();
        }
    }

    async concederPermissaoACL(role, menuId, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query('INSERT INTO permissoes_menu (id, role, menu_id) VALUES (gen_random_uuid(), $1, $2) ON CONFLICT (role, menu_id) DO NOTHING', [role, menuId]);
    }

    async revogarPermissaoACL(role, menuId, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query('DELETE FROM permissoes_menu WHERE role = $1 AND menu_id = $2', [role, menuId]);
    }

    async listarEscoposTabelas() {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT tabela_nome, escopo FROM tabelas_escopo ORDER BY tabela_nome ASC');
            return res.rows;
        } finally {
            client.release();
        }
    }

    async atualizarEscopoTabela(tabelaNome, escopo) {
        const client = await pool.connect();
        try {
            await client.query('UPDATE tabelas_escopo SET escopo = $1 WHERE tabela_nome = $2', [escopo, tabelaNome]);
        } finally {
            client.release();
        }
    }

    async obterDadosRelatorioRecebiveis(empresaId, filialId, inicio, fim) {
        const queryResumo = `
            SELECT v.bandeira, COUNT(rc.id) AS total_parcelas,
                   SUM(CASE WHEN rc.status = 'R' THEN rc.valor_parcela ELSE 0 END) AS total_recebido,
                   SUM(CASE WHEN rc.status = 'P' THEN rc.valor_parcela ELSE 0 END) AS total_a_receber
            FROM recebiveis_cartao rc JOIN vendas v ON v.id = rc.venda_id AND v.deletado = false
            WHERE rc.empresa_id = $1 AND rc.filial_id = $2 AND rc.data_prevista_recebimento >= $3::timestamp AND rc.data_prevista_recebimento <= $4::timestamp AND rc.deletado = false
            GROUP BY v.bandeira ORDER BY total_a_receber DESC, v.bandeira ASC;
        `;
        const queryExtrato = `
            SELECT rc.id, rc.data_prevista_recebimento, v.bandeira, rc.parcela_numero, v.parcelas AS total_parcelas_venda, cx.descricao AS caixa_nome, rc.valor_parcela, rc.status
            FROM recebiveis_cartao rc JOIN vendas v ON v.id = rc.venda_id AND v.deletado = false JOIN caixas cx ON cx.id = rc.caixa_id
            WHERE rc.empresa_id = $1 AND rc.filial_id = $2 AND rc.data_prevista_recebimento >= $3::timestamp AND rc.data_prevista_recebimento <= $4::timestamp AND rc.deletado = false
            ORDER BY rc.data_prevista_recebimento ASC, v.bandeira ASC;
        `;
        return { queryResumo, queryExtrato };
    }
}

export default new ConfigRepository();