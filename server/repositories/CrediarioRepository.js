// server/repositories/CrediarioRepository.js
import pool from '../config/database.js';

class CrediarioRepository {
    /**
     * Busca os dados da ficha cadastral do cliente e suas parcelas abertas
     */
    async obterFichaClientePorTermo(empresaId, termoBusca) {
        // 1. Remove qualquer pontuação ou espaço do termo digitado
        const termoClean = termoBusca.replace(/[.\-\s]/g, '');

        // 2. Query inteligente: $2 para o Nome (com %) e $3 para o CPF (limpo)
        const sqlCliente = `
            SELECT id, nome, cpf, limite_credito, bloqueado, motivo_bloqueio
            FROM clientes
            WHERE empresa_id = $1 
              AND (
                nome ILIKE $2 
                OR regexp_replace(cpf, '[.\\-\\s]', '', 'g') = $3
              )
            LIMIT 1;
        `;
        
        const paramsCliente = [
            empresaId, 
            `%${termoBusca.trim()}%`, // $2 (Nome)
            termoClean                // $3 (CPF limpo)
        ];

        const resCliente = await pool.query(sqlCliente, paramsCliente);
        
        if (resCliente.rows.length === 0) {
            return null;
        }
        
        const cliente = resCliente.rows[0];

        // 3. Busca as parcelas pendentes
        const sqlParcelas = `
            SELECT 
                id, 
                venda_id, 
                parcela_numero AS numero_parcela,
                total_parcelas, 
                data_vencimento,
                valor_original, 
                saldo_restante AS valor_saldo
            FROM contas_a_receber
            WHERE empresa_id = $1 
              AND cliente_id = $2
              AND status IN ('A', 'P')
              AND deletado = false
            ORDER BY data_vencimento ASC;
        `;
        
        const paramsParcelas = [empresaId, cliente.id];
        const resParcelas = await pool.query(sqlParcelas, paramsParcelas);

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
            SET valor_pago = valor_pago + $2,
                saldo_restante = saldo_restante - $2,
                status = CASE WHEN (saldo_restante - $2) <= 0 THEN 'L' ELSE 'P' END,
                data_pagamento = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING saldo_restante;
        `;
        const res = await clientContext.query(sql, [parcelaId, valorPago]);
        return res.rows[0];
    }

    /**
     * Registra a entrada do recebimento de crediário simulando um registro de movimentação/venda (DENTRO DA TRANSAÇÃO)
     */
    async injetarNoExtratoCaixa(caixaId, operadorId, valor, formaPagamento, clienteNome, clientContext, extraData = {}) {
        const { empresaId, filialId, clienteId } = extraData;

        // Monta a query na tabela vendas mapeando exatamente as colunas físicas da imagem 3
        const sql = `
            INSERT INTO vendas (
                id, 
                caixa_id, 
                operador_id, 
                forma_pagamento, 
                origem, 
                total, 
                descricao_movimento, 
                data_venda, 
                deletado, 
                parcelas, 
                empresa_id, 
                filial_id, 
                cliente_id
            ) VALUES (
                gen_random_uuid(), 
                $1, -- caixa_id
                $2, -- operador_id (ex-movimentoId)
                $3, -- forma_pagamento (DN, PX, CD)
                'R', -- origem ('R' de Recebimento de Crediário para auditoria)
                $4, -- total
                $5, -- descricao_movimento (Identifica de qual cliente veio o recebimento)
                CURRENT_TIMESTAMP, 
                false, 
                1, -- parcelas
                $6, -- empresa_id
                $7, -- filial_id
                $8  -- cliente_id
            );
        `;

        const descricao = `RECEBIMENTO CREDIARIO: ${clienteNome || 'Cliente Não Identificado'}`;
        const params = [
            caixaId, 
            operadorId, 
            formaPagamento, 
            valor, 
            descricao,
            empresaId || null,
            filialId || null,
            clienteId || null
        ];

        console.log("=== INSERINDO REGISTRO NO CAIXA (TABELA VENDAS) ===");
        console.log("Parâmetros:", JSON.stringify(params));

        await clientContext.query(sql, params);
    }
}

export default new CrediarioRepository();