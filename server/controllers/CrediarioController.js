// server/controllers/CrediarioController.js
import pool from '../config/database.js';
import CrediarioRepository from '../repositories/CrediarioRepository.js';

class CrediarioController {
    /**
     * Rota GET /api/crediario/extrato
     */
    async obterExtrato(req, res) {
        const { 'x-empresa-id': empresaId } = req.headers;
        const { busca } = req.query;

        try {
            if (!busca) {
                return res.status(400).json({ erro: 'Informe um critério de busca válido.' });
            }

            const dadosFicha = await CrediarioRepository.obterFichaClientePorTermo(empresaId, busca);
            
            if (!dadosFicha) {
                return res.status(404).json({ erro: 'Cliente não localizado na base cadastral.' });
            }

            return res.json(dadosFicha);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Falha ao buscar extrato do cliente.' });
        }
    }

    /**
     * Rota POST /api/crediario/baixar (Mecanismo Transacional Crítico)
     */
    async baixarParcelas(req, res) {
        const { 'x-empresa-id': empresaId } = req.headers;
        const { clienteId, parcelasIds, formaPagamento } = req.body;
        
        // 🌟 REGRA DE NEGÓCIO: Identifica qual caixa o operador está operando pelo token do login
        const movimentoIdAtivo = req.usuario?.movimentoId; 
        const caixaIdAtivo = req.usuario?.caixaId;

        if (formaPagamento === 'DN' && (!movimentoIdAtivo || !caixaIdAtivo)) {
            return res.status(400).json({ 
                erro: 'Operação bloqueada: Não há nenhum turno de Caixa (PDV) aberto para o seu usuário neste terminal.' 
            });
        }

        const client = await pool.connect();
        try {
            // Inicia o isolamento transacional estrito
            await client.query('BEGIN');

            // 1. Busca os dados atuais do cliente para pegar o Nome
            const sqlCli = `SELECT nome FROM clientes WHERE id = $1 AND empresa_id = $2 FOR UPDATE;`;
            const resCli = await client.query(sqlCli, [clienteId, empresaId]);
            if (resCli.rows.length === 0) {
                throw new Error('Ficha do cliente indisponível ou inexistente.');
            }
            const clienteNome = resCli.rows[0].nome;

            let totalPagoAcumulado = 0;

            // 2. Loop de liquidação das parcelas selecionadas
            for (const pId of parcelasIds) {
                // Trava a linha da parcela para evitar Race Conditions (Double Spends)
                const sqlVerifica = `SELECT valor_saldo FROM contas_a_receber WHERE id = $1 AND status IN ('A', 'P') FOR UPDATE;`;
                const resVerifica = await client.query(sqlVerifica, [pId]);
                
                if (resVerifica.rows.length > 0) {
                    const saldoAtual = parseFloat(resVerifica.rows[0].valor_saldo);
                    totalPagoAcumulado += saldoAtual;

                    // Baixa o valor na tabela contas_a_receber
                    await CrediarioRepository.liquidarParcela(pId, saldoAtual, client);
                }
            }

            if (totalPagoAcumulado <= 0) {
                throw new Error('Os títulos selecionados já foram baixados ou são inválidos.');
            }

            // 3. Se o recebimento foi em Dinheiro físico, alimenta automaticamente a gaveta do PDV
            if (formaPagamento === 'DN') {
                await CrediarioRepository.injekatNoExtratoCaixa(
                    caixaIdAtivo, 
                    movimentoIdAtivo, 
                    totalPagoAcumulado, 
                    formaPagamento, 
                    clienteNome, 
                    client
                );
            }

            // Se tudo correu perfeitamente, confirma as escrituras no PostgreSQL
            await client.query('COMMIT');

            // Busca os dados atualizados para devolver à interface limpa
            const dadosAtualizados = await CrediarioRepository.obterFichaClientePorTermo(empresaId, clienteNome);

            return res.json({
                mensagem: `Sucesso! Recebimento de R$ ${totalPagoAcumulado.toFixed(2)} processado e integrado ao sistema.`,
                clienteAtualizado: dadosAtualizados.cliente
            });

        } catch (err) {
            // Em caso de qualquer quebra ou exceção, desfaz tudo da memória imediatamente
            await client.query('ROLLBACK');
            console.error('Falha transacional na baixa:', err);
            return res.status(400).json({ erro: err.message || 'Erro transacional ao efetuar baixa.' });
        } finally {
            client.release();
        }
    }
}

export default new CrediarioController();