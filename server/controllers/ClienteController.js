import ClienteRepository from '../repositories/ClienteRepository.js';

class ClienteController {
    async listar(req, res) {
        const { x_empresa_id } = req.headers;
        const { busca } = req.query;

        if (!x_empresa_id) return res.status(400).json({ erro: 'O cabeçalho x_empresa_id é obrigatório.' });

        try {
            const termo = busca ? String(busca).trim() : '';
            const clientes = await ClienteRepository.listarCompartilhados(x_empresa_id, termo);
            return res.json(clientes);
        } catch (err) {
            console.error('Erro na listagem:', err.message);
            return res.status(500).json({ erro: 'Erro interno ao consultar clientes.' });
        }
    }

    async cadastrar(req, res) {
        const { x_empresa_id, x_filial_id } = req.headers;
        const { nome, cpf, rg, data_nascimento, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, limite_credito, bloqueado, motivo_bloqueio } = req.body;

        if (!x_empresa_id || !nome) return res.status(400).json({ erro: 'Dados obrigatórios ausentes.' });

        const cpfClean = cpf ? cpf.replace(/[.\-_]/g, '') : null;
        
        // 🌟 ARQUITETURA DE ROBUSTEDADE: Inicializa canal atômico para a transação
        const client = await ClienteRepository.getClient();

        try {
            await client.query('BEGIN'); // 🔒 Bloqueia o estado para esta transação

            if (cpfClean) {
                // Passa o client ativo para garantir isolamento do SELECT de validação
                const existe = await ClienteRepository.buscarPorCpf(x_empresa_id, cpfClean, client);
                if (existe) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ erro: 'Este CPF já está cadastrado no sistema.' });
                }
            }

            const payload = {
                nome, rg, data_nascimento, telefone, email, logradouro, numero, complemento, bairro, cidade, estado,
                cpfClean,
                cepClean: cep ? cep.replace(/[.\-_]/g, '') : null,
                limiteFormatado: parseFloat(limite_credito) || 0.00,
                bloqueado: bloqueado || 'N', 
                motivo_bloqueio: bloqueado === 'S' ? motivo_bloqueio : null
            };

            const novoCliente = await ClienteRepository.criar(payload, x_empresa_id, x_filial_id, client);
            
            await client.query('COMMIT'); // 🔓 Grava definitivamente de forma segura
            return res.status(201).json({ mensagem: 'Cliente salvo com sucesso!', cliente: novoCliente });

        } catch (err) {
            await client.query('ROLLBACK'); // 🚨 Desfaz qualquer alteração se houver pane mecânica
            console.error('Erro ao cadastrar cliente:', err.message);
            return res.status(500).json({ erro: 'Falha interna transacional ao salvar cliente.' });
        } finally {
            client.release(); // 🔒 DEVOLUÇÃO OBRIGATÓRIA: Evita travamento do Pool
        }
    }

    async atualizar(req, res) {
        const { x_empresa_id } = req.headers;
        const { id } = req.params;
        const { nome, cpf, rg, data_nascimento, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, limite_credito, bloqueado, motivo_bloqueio } = req.body;

        const cpfClean = cpf ? cpf.replace(/[.\-_]/g, '') : null;
        const client = await ClienteRepository.getClient();

        try {
            await client.query('BEGIN');

            if (cpfClean) {
                const existe = await ClienteRepository.buscarPorCpf(x_empresa_id, cpfClean, client);
                if (existe && existe.id !== id) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ erro: 'Outro cliente já utiliza este número de CPF.' });
                }
            }

            const dadosAtualizacao = {
                nome, rg, data_nascimento, telefone, email, logradouro, numero, complemento, bairro, cidade, estado,
                bloqueado, motivo_bloqueio, cpfClean,
                cepClean: cep ? cep.replace(/[.\-_]/g, '') : null,
                limiteFormatado: parseFloat(limite_credito) || 0.00
            };

            await ClienteRepository.atualizar(id, x_empresa_id, dadosAtualizacao, client);
            
            await client.query('COMMIT');
            return res.json({ mensagem: 'Cadastro atualizado com sucesso!' });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error(err);
            return res.status(500).json({ erro: 'Falha interna transacional ao atualizar cliente.' });
        } finally {
            client.release();
        }
    }

    async deletar(req, res) {
        const { x_empresa_id } = req.headers;
        const { id } = req.params;
        try {
            await ClienteRepository.deletarLogico(id, x_empresa_id);
            return res.json({ mensagem: 'Cliente removido com sucesso do sistema.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro interno ao processar a exclusão.' });
        }
    }
}

export default new ClienteController();