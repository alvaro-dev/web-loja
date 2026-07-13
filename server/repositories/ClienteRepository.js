import pool from '../config/database.js';

class ClienteRepository {
    // Retorna uma conexão exclusiva para o Controller gerenciar a transação se necessário
    async getClient() {
        return await pool.connect();
    }

    async listarCompartilhados(empresaId, termoBusca = '') {
        const client = await pool.connect(); // 🔒 Adquire canal exclusivo
        try {
            let query = `
                SELECT id, empresa_id, filial_id, nome, cpf, rg, data_nascimento, telefone, email,
                       cep, logradouro, numero, complemento, bairro, cidade, estado, 
                       limite_credito, bloqueado, motivo_bloqueio
                FROM clientes 
                WHERE empresa_id = $1 AND deletado = false
            `;
            const params = [empresaId];

            if (termoBusca) {
                const termoClean = termoBusca.replace(/[.\-_]/g, '');
                query += ` AND (UPPER(nome) LIKE UPPER($2) OR cpf LIKE $2 OR id::text = $2)`;
                params.push(`%${termoClean}%`);
            }

            query += ` ORDER BY nome ASC`;
            const resultado = await client.query(query, params);
            return resultado.rows;
        } finally {
            client.release(); // 🔒 Garante a devolução imediata ao Pool, prevenindo memory leaks
        }
    }

    // 🌟 Nota: Este método agora aceita um 'client' externo para rodar de dentro de uma transação ativa
    async buscarPorCpf(empresaId, cpf, clientExterno = null) {
        const executor = clientExterno || pool;
        const query = `SELECT id FROM clientes WHERE empresa_id = $1 AND cpf = $2 AND deletado = false`;
        const res = await executor.query(query, [empresaId, cpf]);
        return res.rows.length > 0 ? res.rows[0] : null;
    }

    async criar(dados, empresaId, filialId, clientExterno = null) {
        const executor = clientExterno || pool;
        const query = `
            INSERT INTO clientes (
                empresa_id, filial_id, nome, cpf, rg, data_nascimento, telefone, email,
                cep, logradouro, numero, complemento, bairro, cidade, estado, limite_credito
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            RETURNING id, nome;
        `;
        const res = await executor.query(query, [
            empresaId, filialId || null, dados.nome, dados.cpfClean, dados.rg, dados.data_nascimento || null,
            dados.telefone, dados.email, dados.cepClean, dados.logradouro, dados.numero, dados.complemento,
            dados.bairro, dados.cidade, dados.estado, dados.limiteFormatado
        ]);
        return res.rows[0];
    }

    async atualizar(id, empresaId, dados, clientExterno = null) {
        const executor = clientExterno || pool;
        const query = `
            UPDATE clientes SET
                nome = $1, cpf = $2, rg = $3, data_nascimento = $4, telefone = $5, email = $6,
                cep = $7, logradouro = $8, numero = $9, complemento = $10, bairro = $11, 
                cidade = $12, estado = $13, limite_credito = $14, bloqueado = $15, motivo_bloqueio = $16
            WHERE id = $17 AND empresa_id = $18 AND deletado = false;
        `;
        await executor.query(query, [
            dados.nome, dados.cpfClean, dados.rg, dados.data_nascimento || null, dados.telefone, dados.email,
            dados.cepClean, dados.logradouro, dados.numero, dados.complemento, dados.bairro, dados.cidade, dados.estado, 
            dados.limiteFormatado, dados.bloqueado || 'N', dados.motivo_bloqueio || null, id, empresaId
        ]);
    }

    async deletarLogico(id, empresaId) {
        const client = await pool.connect();
        try {
            await client.query(
                `UPDATE clientes SET deletado = true WHERE id = $1 AND empresa_id = $2`,
                [id, empresaId]
            );
        } finally {
            client.release();
        }
    }
}

export default new ClienteRepository();