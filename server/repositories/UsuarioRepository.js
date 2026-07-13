import pool from '../config/database.js';

class UsuarioRepository {
    async getClient() {
        return await pool.connect();
    }

    async buscarPorLoginESenha(usuario, senhaHash) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT id, usuario, nome, role, trocar_senha_prox_login 
                FROM usuarios 
                WHERE LOWER(usuario) = LOWER($1) 
                  AND senha = $2 
                  AND bloqueado = 'N' 
                  AND deletado = false
            `;
            const res = await client.query(query, [usuario, senhaHash]);
            return res.rows.length > 0 ? res.rows[0] : null;
        } finally {
            client.release();
        }
    }

    async obterMenusPorRole(role) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT m.titulo, m.rota, m.icone, m.ordem
                FROM menus m
                INNER JOIN permissoes_menu pm ON pm.menu_id = m.id
                WHERE pm.role = $1 AND m.ativo = true AND m.deletado = false
                ORDER BY m.ordem ASC
            `;
            const res = await client.query(query, [role]);
            return res.rows;
        } finally {
            client.release();
        }
    }

    async obterAcessosMultiTenant(usuarioId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT ua.empresa_id, e.nome_fantasia AS empresa_nome,
                       ua.filial_id, f.nome AS filial_nome, ua.padrao
            FROM usuarios_acessos ua
            INNER JOIN empresas e ON e.id = ua.empresa_id
            INNER JOIN filiais f ON f.id = ua.filial_id
            WHERE ua.usuario_id = $1
              AND e.ativo = true AND e.deletado = false
              AND f.ativo = true AND f.deletado = false
            `;
            const res = await client.query(query, [usuarioId]);
            return res.rows;
        } finally {
            client.release();
        }
    }

    async verificarSenhaAntiga(usuarioId, hashAntigo) {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT senha FROM usuarios WHERE id = $1 AND deletado = false', [usuarioId]);
            return res.rows.length > 0 && res.rows[0].senha === hashAntigo;
        } finally {
            client.release();
        }
    }

    async atualizarSenha(usuarioId, hashNovo) {
        const client = await pool.connect();
        try {
            await client.query(`UPDATE usuarios SET senha = $1, trocar_senha_prox_login = 'N' WHERE id = $2`, [hashNovo, usuarioId]);
        } finally {
            client.release();
        }
    }

    async listarTodos() {
        const client = await pool.connect();
        try {
            const res = await client.query(`SELECT id, usuario, nome, role, usuario_pdv, bloqueado, trocar_senha_prox_login FROM usuarios WHERE deletado = false ORDER BY nome ASC`);
            return res.rows;
        } finally {
            client.release();
        }
    }

    // Aceita conexão transacionada para evitar concorrência no momento do cadastro
    async verificarSeLoginExiste(usuario, clientExterno = null) {
        const executor = clientExterno || pool;
        const res = await executor.query('SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER($1) AND deletado = false', [usuario]);
        return res.rows.length > 0;
    }

    async criar(u, hashSenha, clientExterno = null) {
        const executor = clientExterno || pool;
        await executor.query(`
            INSERT INTO usuarios (id, usuario, nome, senha, role, usuario_pdv, bloqueado, trocar_senha_prox_login, deletado)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'N', 'S', false)
        `, [u.usuario, u.nome, hashSenha, u.role, u.usuario_pdv || 'N']);
    }

    async atualizarFlag(id, campo, valor) {
        const client = await pool.connect();
        try {
            // Colunas são validadas de forma estrita no controller antes de entrar aqui
            await client.query(`UPDATE usuarios SET ${campo} = $1 WHERE id = $2`, [valor, id]);
        } finally {
            client.release();
        }
    }

    async softDelete(id) {
        const client = await pool.connect();
        try {
            await client.query(`UPDATE usuarios SET deletado = true WHERE id = $1`, [id]);
        } finally {
            client.release();
        }
    }
}

export default new UsuarioRepository();