import pool from '../config/database.js';

class CaixaRepository {
    async getClient() {
        return await pool.connect();
    }

    async listarTodosFormatados() {
        const client = await pool.connect(); // 🔒 Adquire canal exclusivo
        try {
            const res = await client.query(`
                SELECT c.id, c.descricao AS nome, c.bloqueado, c.empresa_id, c.filial_id,
                       e.nome_fantasia AS empresa_nome, f.nome AS filial_nome
                FROM caixas c
                INNER JOIN empresas e ON e.id = c.empresa_id
                INNER JOIN filiais f ON f.id = c.filial_id
                WHERE c.deletado = false
                ORDER BY e.nome_fantasia ASC, f.nome ASC, c.descricao ASC
            `);
            return res.rows;
        } finally {
            client.release(); // 🔒 Devolução obrigatória ao Pool
        }
    }

    async criar(nome, empresaId, filialId, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query(`
            INSERT INTO caixas (id, descricao, empresa_id, filial_id, bloqueado, deletado)
            VALUES (gen_random_uuid(), $1, $2, $3, 'N', false)
        `, [nome, empresaId, filialId]);
    }

    async atualizarBloqueio(id, statusBloqueio) {
        const client = await pool.connect();
        try {
            await client.query(`UPDATE caixas SET bloqueado = $1 WHERE id = $2`, [statusBloqueio, id]);
        } finally {
            client.release();
        }
    }

    async obterAcompanhamentoRealtime(empresaId, filialId, inicioDia, fimDia) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT c.id AS caixa_id, c.descricao AS caixa_nome, mc.id AS movimento_id, COALESCE(mc.status, 'F') AS status,
                       mc.data_abertura, mc.data_fechamento, COALESCE(mc.valor_abertura, 0) AS valor_abertura, COALESCE(mc.valor_fechamento, 0) AS valor_fechamento,
                       COALESCE(u_ab.nome, 'Nenhum') AS operador_abertura, COALESCE(u_fc.nome, 'Nenhum') AS operador_fechamento,
                       COALESCE((SELECT SUM(CASE WHEN v.origem = 'E' THEN v.total ELSE -v.total END) FROM vendas v WHERE v.caixa_id = c.id AND v.data_venda >= mc.data_abertura AND (mc.data_fechamento IS NULL OR v.data_venda <= mc.data_fechamento) AND v.forma_pagamento = 'DN' AND v.deletado = false), 0) AS dinheiro_turno,
                       COALESCE((SELECT SUM(v.total) FROM vendas v WHERE v.caixa_id = c.id AND v.data_venda >= mc.data_abertura AND (mc.data_fechamento IS NULL OR v.data_venda <= mc.data_fechamento) AND v.forma_pagamento IN ('CC', 'CD', 'PX') AND v.origem = 'E' AND v.deletado = false), 0) AS eletronico_turno
                FROM caixas c
                LEFT JOIN movimentos_caixa mc ON mc.caixa_id = c.id AND mc.data_abertura >= $3::timestamp AND mc.data_abertura <= $4::timestamp AND mc.deletado = false
                LEFT JOIN usuarios u_ab ON u_ab.id = mc.operador_abertura_id
                LEFT JOIN usuarios u_fc ON u_fc.id = mc.operador_fechamento_id
                WHERE c.empresa_id = $1 AND c.filial_id = $2 AND c.bloqueado = 'N'
                ORDER BY mc.status ASC, mc.data_abertura DESC, c.descricao ASC;
            `;
            const res = await client.query(query, [empresaId, filialId, inicioDia, fimDia]);
            return res.rows;
        } finally {
            client.release();
        }
    }

    async obterExtratoVendasPeriodo(caixaId, inicio, fim, empresaId, filialId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT id, origem, total, forma_pagamento, descricao_movimento, data_venda, bandeira, parcelas
                FROM vendas
                WHERE caixa_id = $1 AND data_venda >= $2::timestamp AND ($3::timestamp IS NULL OR data_venda <= $3::timestamp)
                  AND empresa_id = $4 AND filial_id = $5 AND deletado = false
                ORDER BY data_venda DESC
            `;
            const res = await client.query(query, [caixaId, inicio, fim, empresaId, filialId]);
            return res.rows;
        } finally {
            client.release();
        }
    }
}

export default new CaixaRepository();