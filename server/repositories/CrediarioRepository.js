// server/repositories/CrediarioRepository.js
import pool from '../config/database.js';

class CrediarioRepository {
    /**
     * Busca os dados da ficha cadastral do cliente e suas parcelas abertas
     */
    async obterFichaClientePorTermo(empresaId, termoBusca) {
        const termoClean = termoBusca.replace(/[.\-_]/g, '');

        const sqlCliente = `
            SELECT id, nome, cpf, limite_credito, bloqueado
            FROM clientes
            WHERE empresa_id = $1 
              AND (nome ILIKE $2 OR cpf = $3)
              AND deletado = false
            LIMIT 1;
        `;
        const resCliente = await pool.query(sqlCliente, [empresaId, `%${termoBusca}%`, termoClean]);
        
        if (resCliente.rows.length === 0) return null;
        const cliente = resCliente.rows[0];

        const sqlParcelas = `
            SELECT 
                id, 
                venda_id, 
                numero_parcela, 
                total_parcelas, 
                data_vencimento,
                valor_original, 
                valor_saldo,
                CURRENT_DATE - data_vencimento AS dias_atraso
            FROM contas_a_receber
            WHERE empresa_id = $1 
              AND cliente_id = $2
              AND status IN ('A', 'P')
              AND deletado = false
            ORDER BY data_vencimento ASC;
        `;
        const resParcelas = await pool.query(sqlParcelas, [empresaId, cliente.id]);

        return {
            cliente,
            parcelas: resParcelas.rows
        };
    }

    /**
     * Executa a liquidação da parcela na tabela contas_a_receber (DENTRO DA TRANSAÇÃO)
     */
    async liquidarParcela(parcelaId, valorPago, clientContext) {
        const sql = `
            UPDATE contas_a_receber
            SET valor_saldo = valor_saldo - $2,
                status = CASE WHEN (valor_saldo - $2) <= 0 THEN 'L' ELSE 'P' END,
                data_pagamento = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING valor_saldo;
        `;
        const res = await clientContext.query(sql, [parcelaId, valorPago]);
        return res.rows[0];
    }

    /**
     * Registra o fluxo de entrada financeira no Caixa ativo do operador (DENTRO DA TRANSAÇÃO)
     */
    async injetarNoExtratoCaixa(caixaId, movimentoId, valor, formaPagamento, clienteNome, clientContext) {
        const sql = `
            INSERT INTO vendas (
                id, movimento_id, caixa_id, total, forma_pagamento, 
                data_venda, deletado
            ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, 
                CURRENT_TIMESTAMP, false
            );
        `;
        await clientContext.query(sql, [movimentoId, caixaId, valor, formaPagamento]);
    }
}

export default new CrediarioRepository();