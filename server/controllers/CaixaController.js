import CaixaRepository from '../repositories/CaixaRepository.js';

class CaixaController {
    async listar(req, res) {
        try {
            const lista = await CaixaRepository.listarTodosFormatados();
            return res.json(lista.map(cx => ({
                id: cx.id, nome: cx.nome, ativo: cx.bloqueado === 'N',
                empresa_id: cx.empresa_id, filial_id: cx.filial_id, empresa_nome: cx.empresa_nome, filial_nome: cx.filial_nome
            })));
        } catch (err) { 
            console.error('Erro ao listar caixas:', err.message);
            res.status(500).json({ erro: 'Falha interna ao buscar caixas.' }); 
        }
    }

    async cadastrar(req, res) {
        const { nome, empresa_id, filial_id } = req.body;
        if (!nome || !empresa_id || !filial_id) {
            return res.status(400).json({ erro: 'Nome do Caixa, Empresa e Filial são obrigatórios.' });
        }

        const client = await CaixaRepository.getClient();
        try {
            await client.query('BEGIN'); // 🔒 Transação atômica de escrita
            
            await CaixaRepository.criar(nome, empresa_id, filial_id, client);
            
            await client.query('COMMIT'); // 🔓 Confirma gravação
            return res.json({ sucesso: true, mensagem: 'Terminal de Caixa registrado com sucesso!' });
        } catch (err) { 
            await client.query('ROLLBACK');
            console.error('Erro transacional ao criar caixa:', err.message);
            res.status(500).json({ erro: 'Erro interno ao salvar o caixa.' }); 
        } finally {
            client.release(); // 🔒 Devolve a conexão ao pool
        }
    }

    async alternarStatus(req, res) {
        const { id } = req.params;
        const { valor } = req.body;
        
        const statusBloqueio = valor ? 'N' : 'S';
        try {
            await CaixaRepository.atualizarBloqueio(id, statusBloqueio);
            return res.json({ sucesso: true, mensagem: 'Status do caixa modificado!' });
        } catch (err) { 
            console.error('Erro ao alterar status do caixa:', err.message);
            res.status(500).json({ erro: 'Erro ao atualizar o terminal.' }); 
        }
    }

    async monitoramentoRealtime(req, res) {
        const { x_empresa_id, x_filial_id } = req.headers;
        const { dataFiltro } = req.query;

        if (!x_empresa_id || !x_filial_id || !dataFiltro) {
            return res.status(400).json({ erro: 'Parâmetros Multi-Tenant de cabeçalho ou filtro de data ausentes.' });
        }

        try {
            const dados = await CaixaRepository.obterAcompanhamentoRealtime(
                x_empresa_id, x_filial_id, `${dataFiltro} 00:00:00`, `${dataFiltro} 23:59:59`
            );
            return res.json(dados);
        } catch (err) { 
            console.error('Erro no monitoramento realtime de caixas:', err.message);
            res.status(500).json({ erro: 'Erro interno ao processar o painel de caixas.' }); 
        }
    }

    async extratoTurno(req, res) {
        const { x_empresa_id, x_filial_id } = req.headers;
        const { caixaId, dataAbertura, dataFechamento } = req.query;

        if (!x_empresa_id || !x_filial_id || !caixaId) {
            return res.status(400).json({ erro: 'Dados obrigatórios de cabeçalho ou identificação do caixa ausentes.' });
        }

        try {
            const limpar = (str) => (!str || str === 'null' || str === 'undefined' ? null : str.replace('T', ' ').split('.')[0]);
            const dados = await CaixaRepository.obterExtratoVendasPeriodo(
                caixaId, limpar(dataAbertura), limpar(dataFechamento), x_empresa_id, x_filial_id
            );
            return res.json({ status: 'sucesso', dados });
        } catch (err) { 
            console.error('Erro ao processar extrato analítico web:', err.message);
            res.status(500).json({ erro: 'Erro interno ao processar extrato.' }); 
        }
    }
}

export default new CaixaController();