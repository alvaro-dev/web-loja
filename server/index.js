import express from 'express';
import pg from 'pg';
import cors from 'cors';
import crypto from 'crypto';
import 'dotenv/config'; // 🌟 Carrega as variáveis do arquivo .env automaticamente

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do .env ou 3000 por padrão

app.use(cors());
app.use(express.json());

// 🗄️ Configuração Dinâmica com o PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,       // 🌟 Vai ler dinamicamente o IP externo ou localhost
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

// 🔒 Função auxiliar para gerar o hash SHA-256
function gerarHashSenha(senha) {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

// 🧠 Middleware/Helper para descobrir o escopo da tabela e injetar o filtro correto
async function aplicarFiltroTenant(tabelaNome, empresaId, filialId) {
    try {
        // Consulta o dicionário no banco de dados
        const resRegra = await pool.query(
            'SELECT escopo FROM tabelas_escopo WHERE tabela_nome = $1', 
            [tabelaNome]
        );
        
        // Se não achar nada mapeado, o padrão de segurança é isolar por completo (EXCLUSIVO)
        const escopo = resRegra.rows[0]?.escopo || 'EXCLUSIVO'; 

        if (escopo === 'COMPARTILHADO') {
            return {
                sqlFiltro: 'empresa_id = $1',
                valores: [empresaId]
            };
        } else {
            return {
                sqlFiltro: 'empresa_id = $1 AND filial_id = $2',
                valores: [empresaId, filialId]
            };
        }
    } catch (err) {
        console.error(`Erro ao processar escopo multi-tenant para a tabela ${tabelaNome}:`, err);
        throw err;
    }
}

// 🌐 Rota de autenticação para a tela Web
// 🌐 Rota de autenticação unificada com entrega de Menus Dinâmicos
// 🌐 Rota de login atualizada com entrega de Menus e Acessos Multi-Empresa/Filial
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ erro: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const senhaCriptografada = gerarHashSenha(senha);

        // 1. Busca e valida as credenciais do usuário
        const queryUsuario = `
            SELECT id, usuario, nome, role, trocar_senha_prox_login 
            FROM usuarios 
            WHERE LOWER(usuario) = LOWER($1) 
              AND senha = $2 
              AND bloqueado = 'N' 
              AND deletado = false
        `;

        const resultadoUsuario = await pool.query(queryUsuario, [usuario, senhaCriptografada]);

        if (resultadoUsuario.rows.length === 0) {
            return res.status(401).json({ erro: 'Usuário ou senha inválidos, ou conta bloqueada.' });
        }

        const dadosUsuario = resultadoUsuario.rows[0];

        // 2. Busca os menus liberados para a Role deste usuário
        const queryMenus = `
            SELECT m.titulo, m.rota, m.icone, m.ordem
            FROM menus m
            INNER JOIN permissoes_menu pm ON pm.menu_id = m.id
            WHERE pm.role = $1
              AND m.ativo = true
              AND m.deletado = false
            ORDER BY m.ordem ASC
        `;
        const resultadoMenus = await pool.query(queryMenus, [dadosUsuario.role]);

        // 3. 🌟 NOVA BUSCA: Empresas e Filiais autorizadas para este usuário
        const queryAcessos = `
            SELECT 
                ua.empresa_id,
                e.nome_fantasia AS empresa_nome,
                ua.filial_id,
                f.nome AS filial_nome,
                ua.padrao
            FROM usuarios_acessos ua
            INNER JOIN empresas e ON e.id = ua.empresa_id
            INNER JOIN filiais f ON f.id = ua.filial_id
            WHERE ua.usuario_id = $1
              AND e.ativo = true AND e.deletado = false
              AND f.ativo = true AND f.deletado = false
        `;
        const resultadoAcessos = await pool.query(queryAcessos, [dadosUsuario.id]);

        if (resultadoAcessos.rows.length === 0) {
            return res.status(403).json({ erro: 'Este usuário não possui nenhuma filial ou empresa vinculada ao seu acesso.' });
        }

        // 4. Retorna tudo estruturado para o Frontend
        return res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: dadosUsuario.id,
                usuario: dadosUsuario.usuario,
                nome: dadosUsuario.nome,
                role: dadosUsuario.role,
                trocarSenha: dadosUsuario.trocar_senha_prox_login === 'S'
            },
            menus: resultadoMenus.rows,
            acessos: resultadoAcessos.rows // Lista contendo os nós autorizados
        });

    } catch (err) {
        console.error('Erro ao autenticar no PostgreSQL:', err);
        return res.status(500).json({ erro: 'Erro interno no servidor de banco de dados.' });
    }
});

// 🌐 Rota para alteração de senha obrigatória no primeiro login
app.post('/api/alterar-senha', async (req, res) => {
    const { usuarioId, senhaAntiga, novaSenha } = req.body;

    if (!usuarioId || !senhaAntiga || !novaSenha) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    try {
        // 1. Verifica se a senha antiga informada está correta
        const hashSenhaAntiga = gerarHashSenha(senhaAntiga);
        const buscaUser = await pool.query(
            'SELECT senha FROM usuarios WHERE id = $1 AND deletado = false', 
            [usuarioId]
        );

        if (buscaUser.rows.length === 0 || buscaUser.rows[0].senha !== hashSenhaAntiga) {
            return res.status(401).json({ erro: 'A senha antiga informada está incorreta.' });
        }

        // 2. Criptografa a nova senha e atualiza o registro no banco
        const hashNovaSenha = gerarHashSenha(novaSenha);
        await pool.query(
            `UPDATE usuarios 
             SET senha = $1, trocar_senha_prox_login = 'N' 
             WHERE id = $2`,
            [hashNovaSenha, usuarioId]
        );

        return res.json({ sucesso: true, mensagem: 'Senha atualizada com sucesso!' });

    } catch (err) {
        console.error('Erro ao atualizar a senha no PostgreSQL:', err);
        return res.status(500).json({ erro: 'Erro interno ao salvar a nova senha.' });
    }
});

// 👥 1. ROTA: Listar todos os usuários (exceto os que foram excluídos logicamente)
app.get('/api/usuarios', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, usuario, nome, role, usuario_pdv, bloqueado, trocar_senha_prox_login
            FROM usuarios 
            WHERE deletado = false
            ORDER BY nome ASC
        `);
        return res.json(resultado.rows);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        return res.status(500).json({ erro: 'Erro ao listar usuários no banco.' });
    }
});

// 👥 2. ROTA: Cadastrar um novo usuário (Gera UUID e criptografa a senha inicial)
app.post('/api/usuarios', async (req, res) => {
    const { usuario, nome, senha, role, usuario_pdv } = req.body;

    if (!usuario || !nome || !senha || !role) {
        return res.status(400).json({ erro: 'Os campos Usuário, Nome, Senha e Perfil são obrigatórios.' });
    }

    try {
        // Verifica se o login já existe
        const loginExiste = await pool.query('SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER($1) AND deletado = false', [usuario]);
        if (loginExiste.rows.length > 0) {
            return res.status(400).json({ erro: 'Este nome de usuário já está sendo utilizado.' });
        }

        const hashSenha = gerarHashSenha(senha);

        await pool.query(`
            INSERT INTO usuarios (id, usuario, nome, senha, role, usuario_pdv, bloqueado, trocar_senha_prox_login, deletado)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'N', 'S', false)
        `, [usuario, nome, hashSenha, role, usuario_pdv || 'N']);

        return res.json({ sucesso: true, mensagem: 'Usuário cadastrado com sucesso! Ele precisará redefinir a senha no primeiro acesso.' });
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        return res.status(500).json({ erro: 'Erro interno ao salvar novo usuário.' });
    }
});

// 👥 3. ROTA: Alternar status de Bloqueio ou PDV (Atualização rápida)
app.patch('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { campo, valor } = req.body; // campo pode ser 'bloqueado', 'usuario_pdv' ou 'trocar_senha_prox_login'

    // Evita injeção SQL validando as colunas permitidas
    const colunasPermitidas = ['bloqueado', 'usuario_pdv', 'trocar_senha_prox_login'];
    if (!colunasPermitidas.includes(campo)) {
        return res.status(400).json({ erro: 'Ação inválida.' });
    }

    try {
        await pool.query(`UPDATE usuarios SET ${campo} = $1 WHERE id = $2`, [valor, id]);
        return res.json({ sucesso: true, mensagem: 'Status atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar status do usuário:', err);
        return res.status(500).json({ erro: 'Erro ao salvar alteração.' });
    }
});

// 👥 4. ROTA: Exclusão Lógica (Soft Delete)
app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`UPDATE usuarios SET deletado = true WHERE id = $1`, [id]);
        return res.json({ sucesso: true, mensagem: 'Usuário removido com sucesso do painel.' });
    } catch (err) {
        console.error('Erro ao remover usuário:', err);
        return res.status(500).json({ erro: 'Erro interno ao deletar o usuário.' });
    }
});

// 🧭 1. ROTA: Listar todos os menus para o painel de gerenciamento (traz até os deletados)
app.get('/api/gerenciar-menus', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, titulo, rota, icone, ordem, ativo, deletado 
            FROM menus 
            ORDER BY deletado ASC, ordem ASC
        `);
        return res.json(resultado.rows);
    } catch (err) {
        console.error('Erro ao listar menus administrativos:', err);
        return res.status(500).json({ erro: 'Erro ao listar menus.' });
    }
});

// 🧭 2. ROTA: Criar um novo Menu no banco
app.post('/api/gerenciar-menus', async (req, res) => {
    const { titulo, rota, icone, ordem } = req.body;

    if (!titulo || !rota || !icone) {
        return res.status(400).json({ erro: 'Título, rota e ícone são obrigatórios.' });
    }

    try {
        // Verifica duplicidade de rota ativa
        const rotaExiste = await pool.query('SELECT id FROM menus WHERE rota = $1 AND deletado = false', [rota]);
        if (rotaExiste.rows.length > 0) {
            return res.status(400).json({ erro: 'Esta rota já está ativa em outro menu.' });
        }

        await pool.query(`
            INSERT INTO menus (id, titulo, rota, icone, ordem, ativo, deletado)
            VALUES (gen_random_uuid(), $1, $2, $3, $4 || 0, true, false)
        `, [titulo, rota, icone, ordem]);

        return res.json({ sucesso: true, mensagem: 'Novo menu criado com sucesso!' });
    } catch (err) {
        console.error('Erro ao inserir menu:', err);
        return res.status(500).json({ erro: 'Erro interno ao salvar menu.' });
    }
});

// 🧭 3. ROTA: Modificar flags do menu (ativo ou soft-delete)
app.patch('/api/gerenciar-menus/:id', async (req, res) => {
    const { id } = req.params;
    const { campo, valor } = req.body;

    if (!['ativo', 'deletado'].includes(campo)) {
        return res.status(400).json({ erro: 'Ação não permitida.' });
    }

    try {
        await pool.query(`UPDATE menus SET ${campo} = $1 WHERE id = $2`, [valor, id]);
        return res.json({ sucesso: true, mensagem: 'Menu atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar flag do menu:', err);
        return res.status(500).json({ erro: 'Erro ao salvar alteração no menu.' });
    }
});

// 🔒 4. ROTA: Listar a matriz de permissões atual (Cruza as Roles com os Menus ativos)
app.get('/api/gerenciar-permissoes', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT pm.id, pm.role, pm.menu_id 
            FROM permissoes_menu pm
            INNER JOIN menus m ON m.id = pm.menu_id
            WHERE m.deletado = false
        `);
        return res.json(resultado.rows);
    } catch (err) {
        console.error('Erro ao buscar matriz de permissões:', err);
        return res.status(500).json({ erro: 'Erro ao carregar permissões.' });
    }
});

// 🔒 5. ROTA: Conceder ou revogar permissão de um Menu para uma Role
app.post('/api/gerenciar-permissoes/alternar', async (req, res) => {
    const { role, menuId, concedido } = req.body;

    try {
        if (concedido) {
            // Dá a permissão ignorando se já existir
            await pool.query(`
                INSERT INTO permissoes_menu (id, role, menu_id)
                VALUES (gen_random_uuid(), $1, $2)
                ON CONFLICT (role, menu_id) DO NOTHING
            `, [role, menuId]);
        } else {
            // Remove a permissão
            await pool.query(`
                DELETE FROM permissoes_menu 
                WHERE role = $1 AND menu_id = $2
            `, [role, menuId]);
        }
        return res.json({ sucesso: true, mensagem: 'Permissão atualizada!' });
    } catch (err) {
        console.error('Erro ao alternar permissão:', err);
        return res.status(500).json({ erro: 'Erro ao processar alteração de acesso.' });
    }
});

// ======================================================================
// 🏢 ROTAS ADMINISTRATIVAS: CRUD DE EMPRESAS
// ======================================================================

// 🏢 1. Listar todas as empresas (incluindo as inativas, ocultando deletadas)
app.get('/api/crud-empresas', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT id, razao_social, nome_fantasia, cnpj, ativo FROM empresas WHERE deletado = false ORDER BY nome_fantasia ASC');
        return res.json(resultado.rows);
    } catch (err) {
        console.error('Erro ao listar empresas no CRUD:', err);
        return res.status(500).json({ erro: 'Erro ao buscar empresas.' });
    }
});

// 🏢 2. Cadastrar nova Empresa
app.post('/api/crud-empresas', async (req, res) => {
    const { razao_social, nome_fantasia, cnpj } = req.body;
    if (!razao_social || !nome_fantasia) return res.status(400).json({ erro: 'Razão Social e Nome Fantasia são obrigatórios.' });

    try {
        await pool.query(
            'INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, ativo, deletado) VALUES (gen_random_uuid(), $1, $2, $3, true, false)',
            [razao_social, nome_fantasia, cnpj]
        );
        return res.json({ sucesso: true, mensagem: 'Empresa cadastrada com sucesso!' });
    } catch (err) {
        console.error('Erro ao cadastrar empresa:', err);
        return res.status(500).json({ erro: 'Erro interno ao salvar empresa.' });
    }
});

// 🏢 3. Alterar flag (ativo ou deletado) da Empresa
app.patch('/api/crud-empresas/:id', async (req, res) => {
    const { id } = req.params;
    const { campo, valor } = req.body;
    if (!['ativo', 'deletado'].includes(campo)) return res.status(400).json({ erro: 'Ação inválida.' });

    try {
        await pool.query(`UPDATE empresas SET ${campo} = $1 WHERE id = $2`, [valor, id]);
        return res.json({ sucesso: true, mensagem: 'Empresa atualizada!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao salvar alteração da empresa.' });
    }
});


// ======================================================================
// 📍 ROTAS ADMINISTRATIVAS: CRUD DE FILIAIS
// ======================================================================

// 📍 1. Listar todas as filiais do sistema cruzando com o nome da Empresa
app.get('/api/crud-filiais', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT f.id, f.empresa_id, f.nome, f.cnpj, f.cidade, f.estado, f.ativo, e.nome_fantasia AS empresa_nome
            FROM filiais f
            INNER JOIN empresas e ON e.id = f.empresa_id
            WHERE f.deletado = false
            ORDER BY e.nome_fantasia ASC, f.nome ASC
        `);
        return res.json(resultado.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao buscar filiais.' });
    }
});

// 📍 2. Cadastrar nova Filial
app.post('/api/crud-filiais', async (req, res) => {
    const { empresa_id, nome, cnpj, cidade, estado } = req.body;
    if (!empresa_id || !nome) return res.status(400).json({ erro: 'Empresa e Nome da Filial são obrigatórios.' });

    try {
        await pool.query(
            'INSERT INTO filiais (id, empresa_id, nome, cnpj, cidade, estado, ativo, deletado) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, false)',
            [empresa_id, nome, cnpj, cidade, estado]
        );
        return res.json({ sucesso: true, mensagem: 'Filial cadastrada com sucesso!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro interno ao salvar filial.' });
    }
});

// 📍 3. Alterar flag (ativo ou deletado) da Filial
app.patch('/api/crud-filiais/:id', async (req, res) => {
    const { id } = req.params;
    const { campo, valor } = req.body;
    if (!['ativo', 'deletado'].includes(campo)) return res.status(400).json({ erro: 'Ação inválida.' });

    try {
        await pool.query(`UPDATE filiais SET ${campo} = $1 WHERE id = $2`, [valor, id]);
        return res.json({ sucesso: true, mensagem: 'Filial atualizada!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao salvar alteração da filial.' });
    }
});

// ======================================================================
// 🔐 ROTAS ADMINISTRATIVAS: VÍNCULOS DE ACESSOS (USUÁRIOS x FILIAIS)
// ======================================================================

// 🔐 1. Listar a matriz completa de acessos configurados no sistema
app.get('/api/crud-usuarios-acessos', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT 
                ua.id, ua.usuario_id, ua.empresa_id, ua.filial_id, ua.padrao,
                u.nome AS usuario_nome, u.usuario AS usuario_login,
                e.nome_fantasia AS empresa_nome,
                f.nome AS filial_nome
            FROM usuarios_acessos ua
            INNER JOIN usuarios u ON u.id = ua.usuario_id
            INNER JOIN empresas e ON e.id = ua.empresa_id
            INNER JOIN filiais f ON f.id = ua.filial_id
            WHERE u.deletado = false AND e.deletado = false AND f.deletado = false
            ORDER BY u.nome ASC, e.nome_fantasia ASC, f.nome ASC
        `);
        return res.json(resultado.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao buscar matriz de acessos.' });
    }
});

// 🔐 2. Vincular Usuário a uma Empresa/Filial
app.post('/api/crud-usuarios-acessos', async (req, res) => {
    const { usuario_id, empresa_id, filial_id, padrao } = req.body;

    if (!usuario_id || !empresa_id || !filial_id) {
        return res.status(400).json({ erro: 'Usuário, Empresa e Filial são obrigatórios.' });
    }

    try {
        // Se for marcado como padrão, remove o padrão antigo desse usuário antes
        if (padrao) {
            await pool.query('UPDATE usuarios_acessos SET padrao = false WHERE usuario_id = $1', [usuario_id]);
        } else {
            // Se for o primeiro acesso desse usuário, força ser o padrão obrigatoriamente
            const primeiroAcesso = await pool.query('SELECT id FROM usuarios_acessos WHERE usuario_id = $1', [usuario_id]);
            if (primeiroAcesso.rows.length === 0) {
                req.body.padrao = true;
            }
        }

        await pool.query(`
            INSERT INTO usuarios_acessos (id, usuario_id, empresa_id, filial_id, padrao)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
            ON CONFLICT (usuario_id, empresa_id, filial_id) 
            DO UPDATE SET padrao = EXCLUDED.padrao
        `, [usuario_id, empresa_id, filial_id, req.body.padrao || false]);

        return res.json({ sucesso: true, mensagem: 'Permissão de acesso vinculada!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro interno ao salvar permissão de filial.' });
    }
});

// 🔐 3. Deletar (Revogar) o acesso de um usuário a uma filial
app.delete('/api/crud-usuarios-acessos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Impede deletar se for o acesso padrão (o usuário precisa ter pelo menos um acesso padrão ativo)
        const checkPadrao = await pool.query('SELECT padrao, usuario_id FROM usuarios_acessos WHERE id = $1', [id]);
        if (checkPadrao.rows.length > 0 && checkPadrao.rows[0].padrao) {
            // Se ele tiver outros acessos, avisa que precisa definir outro padrão primeiro
            return res.status(400).json({ erro: 'Não é possível remover o acesso padrão. Defina outra filial como padrão para este usuário antes.' });
        }

        await pool.query('DELETE FROM usuarios_acessos WHERE id = $1', [id]);
        return res.json({ sucesso: true, mensagem: 'Acesso revogado com sucesso!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao revogar acesso.' });
    }
});

// ======================================================================
// 📟 ROTAS ADMINISTRATIVAS: CRUD DE CAIXAS (PDV) - CORRIGIDO
// ======================================================================

// 📟 1. Listar caixas trocando c.nome por c.descricao
app.get('/api/crud-caixas', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT c.id, c.descricao AS nome, c.bloqueado, c.empresa_id, c.filial_id,
                   e.nome_fantasia AS empresa_nome,
                   f.nome AS filial_nome
            FROM caixas c
            INNER JOIN empresas e ON e.id = c.empresa_id
            INNER JOIN filiais f ON f.id = c.filial_id
            WHERE c.deletado = false
            ORDER BY e.nome_fantasia ASC, f.nome ASC, c.descricao ASC
        `);
        
        // Mapeia temporariamente 'bloqueado' para o padrão 'ativo' do front
        const caixasFormatados = resultado.rows.map(cx => ({
            id: cx.id,
            nome: cx.nome,
            ativo: cx.bloqueado === 'N', // Se não está bloqueado, está ativo
            empresa_id: cx.empresa_id,
            filial_id: cx.filial_id,
            empresa_nome: cx.empresa_nome,
            filial_nome: cx.filial_nome
        }));

        return res.json(caixasFormatados);
    } catch (err) {
        console.error('Erro ao listar caixas:', err);
        return res.status(500).json({ erro: 'Erro ao buscar terminais de caixas.' });
    }
});

// 📟 2. Cadastrar salvando na coluna "descricao" e definindo "bloqueado = 'N'"
app.post('/api/crud-caixas', async (req, res) => {
    const { nome, empresa_id, filial_id } = req.body;
    if (!nome || !empresa_id || !filial_id) {
        return res.status(400).json({ erro: 'Nome do Caixa, Empresa e Filial são obrigatórios.' });
    }

    try {
        await pool.query(`
            INSERT INTO caixas (id, descricao, empresa_id, filial_id, bloqueado, deletado)
            VALUES (gen_random_uuid(), $1, $2, $3, 'N', false)
        `, [nome, empresa_id, filial_id]);

        return res.json({ sucesso: true, message: 'Terminal de Caixa registrado com sucesso!', mensagem: 'Terminal de Caixa registrado com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar caixa:', err);
        return res.status(500).json({ erro: 'Erro interno ao salvar o caixa.' });
    }
});

// 📟 3. Alterar flag de bloqueio mapeado
app.patch('/api/crud-caixas/:id', async (req, res) => {
    const { id } = req.params;
    const { valor } = req.body; // recebe true/false para 'ativo'
    
    const statusBloqueio = valor ? 'N' : 'S'; // Se ativo = true, bloqueado = 'N'

    try {
        await pool.query(`UPDATE caixas SET bloqueado = $1 WHERE id = $2`, [statusBloqueio, id]);
        return res.json({ sucesso: true, mensagem: 'Status do caixa modificado!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao atualizar o terminal.' });
    }
});

// 📟 ROTA: Acompanhamento de Caixas em Tempo Real (Filtrado por Tenant)
// 📟 ROTA CORRIGIDA: Acompanhamento de Caixas em Tempo Real
// 📟 ROTA ATUALIZADA: Traz todos os turnos (Abertos e Fechados) individualmente por card
// 📟 ROTA ATUALIZADA: Acompanhamento de Caixas com Separação de Dinheiro e Eletrônico
app.get('/api/acompanhamento-caixas', async (req, res) => {
    const { x_empresa_id, x_filial_id } = req.headers;
    const { dataFiltro } = req.query; // 🌟 Captura o dia enviado pelo Vue (Formato YYYY-MM-DD)

    if (!x_empresa_id || !x_filial_id) {
        return res.status(400).json({ erro: 'Empresa e Filial ativas precisam ser especificadas nos cabeçalhos.' });
    }

    // Monta os limites estritos de início e fim daquele dia
    const inicioDia = `${dataFiltro} 00:00:00`;
    const fimDia = `${dataFiltro} 23:59:59`;

    try {
        const query = `
            SELECT 
                c.id AS caixa_id,
                c.descricao AS caixa_nome,
                mc.id AS movimento_id,
                COALESCE(mc.status, 'F') AS status,
                mc.data_abertura,
                mc.data_fechamento,
                COALESCE(mc.valor_abertura, 0) AS valor_abertura,
                COALESCE(mc.valor_fechamento, 0) AS valor_fechamento,
                COALESCE(u_ab.nome, 'Nenhum') AS operador_abertura,
                COALESCE(u_fc.nome, 'Nenhum') AS operador_fechamento,
                COALESCE((
                    SELECT SUM(CASE WHEN v.origem = 'E' THEN v.total ELSE -v.total END)
                    FROM vendas v 
                    WHERE v.caixa_id = c.id 
                      AND v.data_venda >= mc.data_abertura 
                      AND (mc.data_fechamento IS NULL OR v.data_venda <= mc.data_fechamento)
                      AND v.forma_pagamento = 'DN'
                      AND v.deletado = false
                ), 0) AS dinheiro_turno,
                COALESCE((
                    SELECT SUM(v.total) 
                    FROM vendas v 
                    WHERE v.caixa_id = c.id 
                      AND v.data_venda >= mc.data_abertura 
                      AND (mc.data_fechamento IS NULL OR v.data_venda <= mc.data_fechamento)
                      AND v.forma_pagamento IN ('CC', 'CD', 'PX')
                      AND v.origem = 'E'
                      AND v.deletado = false
                ), 0) AS eletronico_turno
            FROM caixas c
            -- 🌟 TRAVA DIÁRIA: O LEFT JOIN agora só se vincula a turnos criados no dia do filtro
            LEFT JOIN movimentos_caixa mc ON mc.caixa_id = c.id 
                                         AND mc.data_abertura >= $3::timestamp 
                                         AND mc.data_abertura <= $4::timestamp
                                         AND mc.deletado = false
            LEFT JOIN usuarios u_ab ON u_ab.id = mc.operador_abertura_id
            LEFT JOIN usuarios u_fc ON u_fc.id = mc.operador_fechamento_id
            WHERE c.empresa_id = $1 
              AND c.filial_id = $2 
              AND c.bloqueado = 'N'
            ORDER BY mc.status ASC, mc.data_abertura DESC, c.descricao ASC;
        `;

        const resultado = await pool.query(query, [x_empresa_id, x_filial_id, inicioDia, fimDia]);
        return res.json(resultado.rows);
    } catch (err) {
        console.error('Erro no acompanhamento de caixas com filtro:', err);
        return res.status(500).json({ erro: 'Erro interno ao processar o painel de caixas.' });
    }
});

// ======================================================================
// 🧠 ROTAS ADMINISTRATIVAS: CRUD DE DICIONÁRIO DE ESCOPO (MULTI-TENANT)
// ======================================================================

// 🧠 1. Listar todas as regras de tabelas cadastradas
app.get('/api/tabelas-escopo', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT tabela_nome, escopo FROM tabelas_escopo ORDER BY tabela_nome ASC');
        return res.json(resultado.rows);
    } catch (err) {
        console.error('Erro ao listar escopos de tabelas:', err);
        return res.status(500).json({ erro: 'Erro ao buscar dicionário de escopos.' });
    }
});

// 🧠 2. Atualizar o escopo de uma tabela específica
app.put('/api/tabelas-escopo/:tabela_nome', async (req, res) => {
    const { tabela_nome } = req.params;
    const { escopo } = req.body;

    if (!escopo || !['EXCLUSIVO', 'COMPARTILHADO'].includes(escopo)) {
        return res.status(400).json({ erro: 'Escopo inválido. Deve ser EXCLUSIVO ou COMPARTILHADO.' });
    }

    try {
        await pool.query(
            'UPDATE tabelas_escopo SET escopo = $1 WHERE tabela_nome = $2',
            [escopo, tabela_nome]
        );
        return res.json({ sucesso: true, mensagem: `Escopo da tabela ${tabela_nome} atualizado para ${escopo}!` });
    } catch (err) {
        console.error('Erro ao atualizar escopo da tabela:', err);
        return res.status(500).json({ erro: 'Erro interno ao modificar escopo.' });
    }
});

// 💳 ROTA: Relatório Gerencial de Recebíveis de Cartão (Multi-Tenant)
// 💳 ROTA CORRIGIDA: Relatório Gerencial de Recebíveis de Cartão (Multi-Tenant)
app.get('/api/relatorio-recebiveis', async (req, res) => {
    const { x_empresa_id, x_filial_id } = req.headers;
    const { dataInicio, dataFim } = req.query; // 🌟 Captura os limites temporais enviados pelo Vue

    if (!x_empresa_id || !x_filial_id) {
        return res.status(400).json({ erro: 'Faltam dados estruturais de cabeçalho.' });
    }

    // Configura os limites estritos de início e fim da consulta para o timezone timestamp
    const dataInicioClean = `${dataInicio} 00:00:00`;
    const dataFimClean = `${dataFim} 23:59:59`;

    try {
        // 1. QUERY DOS CARDS SUPERIORES: Consolida os totais por bandeira dentro do período
        const queryResumo = `
            SELECT 
                v.bandeira,
                COUNT(rc.id) AS total_parcelas,
                SUM(CASE WHEN rc.status = 'R' THEN rc.valor_parcela ELSE 0 END) AS total_recebido,
                SUM(CASE WHEN rc.status = 'P' THEN rc.valor_parcela ELSE 0 END) AS total_a_receber
            FROM recebiveis_cartao rc
            JOIN vendas v ON v.id = rc.venda_id AND v.deletado = false
            WHERE rc.empresa_id = $1 
              AND rc.filial_id = $2
              AND rc.data_prevista_recebimento >= $3::timestamp
              AND rc.data_prevista_recebimento <= $4::timestamp
              AND rc.deletado = false
            GROUP BY v.bandeira
            ORDER BY total_a_receber DESC, v.bandeira ASC;
        `;

        // 2. QUERY DA AGENDA FUTURA: Lista as linhas detalhadas dentro do período
        const queryExtrato = `
            SELECT 
                rc.id,
                rc.data_prevista_recebimento,
                v.bandeira,
                rc.parcela_numero,
                v.parcelas AS total_parcelas_venda,
                cx.descricao AS caixa_nome,
                rc.valor_parcela,
                rc.status
            FROM recebiveis_cartao rc
            JOIN vendas v ON v.id = rc.venda_id AND v.deletado = false
            JOIN caixas cx ON cx.id = rc.caixa_id
            WHERE rc.empresa_id = $1 
              AND rc.filial_id = $2
              AND rc.data_prevista_recebimento >= $3::timestamp
              AND rc.data_prevista_recebimento <= $4::timestamp
              AND rc.deletado = false
            ORDER BY rc.data_prevista_recebimento ASC, v.bandeira ASC;
        `;

        const [resumoBanco, extratoBanco] = await Promise.all([
            pool.query(queryResumo, [x_empresa_id, x_filial_id, dataInicioClean, dataFimClean]),
            pool.query(queryExtrato, [x_empresa_id, x_filial_id, dataInicioClean, dataFimClean])
        ]);

        return res.json({
            resumoBandeiras: resumoBanco.rows,
            extratoParcelas: extratoBanco.rows
        });

    } catch (err) {
        console.error('Erro na conciliação por período:', err);
        return res.status(500).json({ erro: 'Erro interno ao processar o balanço de cartões.' });
    }
});

// ======================================================================
// 📊 ROTA OPERACIONAL: EXTRATO ANALÍTICO DE TURNOS (ACOMPANHAMENTO WEB)
// ======================================================================
// 📊 ROTA OPERACIONAL: Extrato analítico de turnos (Alinhamento Literal com o Banco)
app.get('/api/obter-vendas-periodo', async (req, res) => {
    const { x_empresa_id, x_filial_id } = req.headers;
    const { caixaId, dataAbertura, dataFechamento } = req.query;

    if (!x_empresa_id || !x_filial_id) {
        return res.status(400).json({ erro: 'Filtros de Empresa e Filial são obrigatórios nos cabeçalhos.' });
    }

    try {
        const limparStringData = (str) => {
            if (!str || str === 'null' || str === 'undefined' || str === '') return null;
            return str.replace('T', ' ').replace('Z', '').split('.')[0];
        };

        const dataInicioClean = limparStringData(dataAbertura);
        const dataFimClean = limparStringData(dataFechamento);

        console.log(`📡 [WEB-API] Buscando lançamentos do Caixa: ${caixaId} | Início: ${dataInicioClean} | Fim: ${dataFimClean || 'Turno Atual'}`);

        const queryPG = `
            SELECT id, origem, total, forma_pagamento, descricao_movimento, data_venda, bandeira, parcelas
            FROM vendas
            WHERE caixa_id = $1 
              AND data_venda >= $2::timestamp
              AND ($3::timestamp IS NULL OR data_venda <= $3::timestamp)
              AND empresa_id = $4
              AND filial_id = $5
              AND deletado = false
            ORDER BY data_venda DESC
        `;
        
        const resultado = await pool.query(queryPG, [caixaId, dataInicioClean, dataFimClean, x_empresa_id, x_filial_id]);
        return res.json({ status: 'sucesso', dados: resultado.rows });
    } catch (err) {
        console.error("🔴 Erro ao processar extrato analítico web:", err.message);
        return res.status(500).json({ erro: 'Erro interno ao processar extrato.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend gerencial rodando de forma dinâmica na porta http://localhost:${PORT}`);
});