// server/controllers/ClienteController.js
import ClienteRepository from '../repositories/ClienteRepository.js';

function extrairEmpresaEFilial(req) {
    const empresaId = req.headers['x-empresa-id'] || req.headers['empresa-id'] || req.headers['x_empresa_id'] || req.headers['empresa_id'];
    const filialId = req.headers['x-filial-id'] || req.headers['filial-id'] || req.headers['x_filial_id'] || req.headers['filial_id'];
    return { empresaId, filialId };
}

class ClienteController {
    async listar(req, res) {
        const { empresaId } = extrairEmpresaEFilial(req);
        const { busca } = req.query;

        if (!empresaId) {
            return res.status(400).json({ erro: 'O cabeçalho da Empresa ativa é obrigatório.' });
        }

        try {
            const termo = busca ? String(busca).trim() : '';
            const clientes = await ClienteRepository.listarCompartilhados(empresaId, termo);
            return res.json(clientes);
        } catch (err) {
            console.error('Erro na listagem:', err.message);
            return res.status(500).json({ erro: 'Erro interno ao consultar clientes.' });
        }
    }

    async cadastrar(req, res) {
        const { empresaId, filialId } = extrairEmpresaEFilial(req);
        const { nome, cpf, rg, data_nascimento, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, limite_credito, bloqueado, motivo_bloqueio } = req.body;

        if (!empresaId || !nome) {
            return res.status(400).json({ erro: 'Dados obrigatórios ausentes (Empresa e Nome do Cliente são necessários).' });
        }

        const cpfClean = cpf ? cpf.replace(/[.\-_]/g, '') : null;
        const client = await ClienteRepository.getClient();

        try {
            await client.query('BEGIN');

            if (cpfClean) {
                const existe = await ClienteRepository.buscarPorCpf(empresaId, cpfClean, client);
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

            const novoCliente = await ClienteRepository.criar(payload, empresaId, filialId, client);
            
            await client.query('COMMIT');
            return res.status(201).json({ mensagem: 'Cliente salvo com sucesso!', cliente: novoCliente });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Erro ao cadastrar cliente:', err.message);
            return res.status(500).json({ erro: 'Falha interna transacional ao salvar cliente.' });
        } finally {
            client.release();
        }
    }

    async atualizar(req, res) {
        const { empresaId } = extrairEmpresaEFilial(req);
        const { id } = req.params;
        const { nome, cpf, rg, data_nascimento, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, limite_credito, bloqueado, motivo_bloqueio } = req.body;

        if (!empresaId) {
            return res.status(400).json({ erro: 'Identificação da Empresa ausente.' });
        }

        const cpfClean = cpf ? cpf.replace(/[.\-_]/g, '') : null;
        const client = await ClienteRepository.getClient();

        try {
            await client.query('BEGIN');

            if (cpfClean) {
                const existe = await ClienteRepository.buscarPorCpf(empresaId, cpfClean, client);
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

            await ClienteRepository.atualizar(id, empresaId, dadosAtualizacao, client);
            
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
        const { empresaId } = extrairEmpresaEFilial(req);
        const { id } = req.params;
        try {
            await ClienteRepository.deletarLogico(id, empresaId);
            return res.json({ mensagem: 'Cliente removido com sucesso do sistema.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro interno ao processar a exclusão.' });
        }
    }
}

export default new ClienteController();