// server/controllers/CrediarioController.js
import pool from '../config/database.js';
import CrediarioRepository from '../repositories/CrediarioRepository.js';

class CrediarioController {
    /**
     * Rota GET /api/crediario/extrato
     */
    async obterExtrato(req, res) {
        // 1. Tenta pegar dos cabeçalhos (headers) enviados pelo front-end
        let empresaId = req.headers['x-empresa-id'] || req.headers['empresa-id'];
        
        // 2. Se não estiver no header, tenta pegar dos parâmetros de query da URL (?empresaId=...)
        if (!empresaId || empresaId === 'undefined' || empresaId === 'null') {
            empresaId = req.query.empresaId;
        }

        const { busca } = req.query;

        try {
            if (!busca) {
                return res.status(400).json({ erro: 'Informe um critério de busca válido.' });
            }

            // 3. FALLBACK DE SEGURANÇA: Se ainda assim estiver nulo, busca a primeira empresa ativa no banco
            if (!empresaId || empresaId === 'undefined' || empresaId === 'null') {
                console.warn("⚠️ Alerta: 'empresaId' não foi enviado pelo front-end. Buscando fallback no banco de dados...");
                const resEmpresaFallback = await pool.query(`SELECT id FROM empresas LIMIT 1;`);
                if (resEmpresaFallback.rows.length > 0) {
                    empresaId = resEmpresaFallback.rows[0].id;
                    console.log(`✅ Usando empresa ID fallback do banco: ${empresaId}`);
                } else {
                    return res.status(400).json({ erro: 'Não foi possível identificar a empresa ativa no sistema.' });
                }
            }

            const dadosFicha = await CrediarioRepository.obterFichaClientePorTermo(empresaId, busca);
            
            if (!dadosFicha) {
                return res.status(404).json({ erro: 'Cliente não localizado na base cadastral.' });
            }

            return res.json(dadosFicha);
        } catch (err) {
            console.error("Erro ao obter extrato:", err);
            return res.status(500).json({ erro: 'Falha ao buscar extrato do cliente.' });
        }
    }

    /**
     * Rota POST /api/crediario/baixar (Mecanismo Transacional Crítico)
     */
    async baixarParcelas(req, res) {
        // 1. Captura as credenciais de governança estritamente dos headers do front-end
        let empresaId = req.headers['x-empresa-id'] || req.headers['empresa-id'];
        let filialId = req.headers['x-filial-id'] || req.headers['filial-id'];
        
        // Captura o usuário ativo enviado pelo front-end
        let operadorId = req.headers['x-usuario-id'] || 
                         req.headers['usuario-id'] || 
                         req.headers['x-operador-id'] || 
                         req.headers['operador-id'] ||
                         req.headers['usuario_id'] ||
                         req.headers['operador_id'];

        // Como não há JWT, tentamos buscar o caixa ativo enviado opcionalmente em algum header customizado
        let caixaIdAtivo = req.headers['x-caixa-id'] || req.headers['caixa-id'] || null;

        const { clienteId, parcelasIds, formaPagamento } = req.body;

        // Fallback de segurança para o empresaId se necessário
        if (!empresaId || empresaId === 'undefined' || empresaId === 'null') {
            console.warn("⚠️ [REQUISITO] Alerta: 'empresaId' ausente nos headers. Buscando primeira empresa ativa...");
            const resEmpresaFallback = await pool.query(`SELECT id FROM empresas LIMIT 1;`);
            if (resEmpresaFallback.rows.length > 0) {
                empresaId = resEmpresaFallback.rows[0].id;
            } else {
                return res.status(400).json({ erro: 'Não foi possível identificar a empresa ativa.' });
            }
        }

        // Se o operador/usuário vier nulo do front-end, limpamos as strings inválidas
        if (operadorId === 'undefined' || operadorId === 'null') {
            operadorId = null;
        }
        if (caixaIdAtivo === 'undefined' || caixaIdAtivo === 'null') {
            caixaIdAtivo = null;
        }

        // 🌟 LOG DE MONITORAMENTO REAL-TIME (Sem JWT)
        console.log("========================================================");
        console.log("📥 PROCESSANDO RECEBIMENTO DE CREDIO (SEM JWT)");
        console.log(`🏢 Empresa ID:    ${empresaId}`);
        console.log(`🏢 Filial ID:     ${filialId || 'NULL'}`);
        console.log(`👤 Operador ID:   ${operadorId || 'NULL (Não enviado pelo front)'}`);
        console.log(`📦 Caixa ID:      ${caixaIdAtivo || 'NULL (Não enviado pelo front)'}`);
        console.log(`💳 Meio de Pgto:  ${formaPagamento}`);
        console.log(`👥 Cliente ID:    ${clienteId}`);
        console.log(`📄 Parcelas IDs:  `, JSON.stringify(parcelasIds));
        console.log("========================================================");

        // Regra de validação: Só bloqueia se for Dinheiro (DN) e não houver caixa identificado.
        // Para PIX (PX) ou Cartão, o fluxo financeiro pode ser integrado mesmo sem caixa físico.
        // Substitua as linhas 104-108 de server/controllers/CrediarioController.js:
/*        if (formaPagamento === 'DN' && !caixaIdAtivo) {
            return res.status(400).json({ 
                erro: 'Operação bloqueada: É necessário informar um Caixa ativo para realizar recebimentos em Dinheiro.' 
            });
        }
*/
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Busca o nome do cliente
            const sqlCli = `SELECT nome FROM clientes WHERE id = $1 AND empresa_id = $2 FOR UPDATE;`;
            const resCli = await client.query(sqlCli, [clienteId, empresaId]);
            if (resCli.rows.length === 0) {
                throw new Error('Ficha do cliente indisponível ou inexistente.');
            }
            const clienteNome = resCli.rows[0].nome;

            let totalPagoAcumulado = 0;

            // 2. Liquida as parcelas
            for (const pId of parcelasIds) {
                const sqlVerifica = `SELECT saldo_restante AS valor_saldo FROM contas_a_receber WHERE id = $1 AND status IN ('A', 'P') FOR UPDATE;`;
                const resVerifica = await client.query(sqlVerifica, [pId]);
                
                if (resVerifica.rows.length > 0) {
                    const saldoAtual = parseFloat(resVerifica.rows[0].valor_saldo);
                    totalPagoAcumulado += saldoAtual;

                    await CrediarioRepository.liquidarParcela(pId, saldoAtual, client);
                    console.log(`✅ Parcela [${pId}] liquidada com o valor de R$ ${saldoAtual.toFixed(2)}`);
                }
            }

            if (totalPagoAcumulado <= 0) {
                throw new Error('Os títulos selecionados já foram baixados ou são inválidos.');
            }

            // 3. Insere na tabela de vendas/caixa passando exatamente o que foi recebido do front-end (mesmo que nulo)
            console.log(`🔄 Registrando venda/recebimento de R$ ${totalPagoAcumulado.toFixed(2)}...`);
            await CrediarioRepository.injetarNoExtratoCaixa(
                caixaIdAtivo, 
                operadorId, 
                totalPagoAcumulado, 
                formaPagamento, 
                clienteNome, 
                client,
                {
                    empresaId,
                    filialId: filialId || null,
                    clienteId
                }
            );

            await client.query('COMMIT');
            console.log(`💾 Transação concluída com sucesso no banco de dados!`);

            const dadosAtualizados = await CrediarioRepository.obterFichaClientePorTermo(empresaId, clienteNome);

            return res.json({
                mensagem: `Sucesso! Recebimento de R$ ${totalPagoAcumulado.toFixed(2)} processado e integrado ao sistema.`,
                clienteAtualizado: dadosAtualizados?.cliente || null
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('❌ [CRÍTICO] Falha transacional na baixa:', err.message || err);
            return res.status(400).json({ erro: err.message || 'Erro transacional ao efetuar baixa.' });
        } finally {
            client.release();
        }
    }
}

export default new CrediarioController();