import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import AuthController from './controllers/AuthController.js';
import UsuarioController from './controllers/UsuarioController.js';
import ClienteController from './controllers/ClienteController.js';
import CaixaController from './controllers/CaixaController.js';
import ConfigController from './controllers/ConfigController.js';
import CrediarioController from './controllers/CrediarioController.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🚪 ROTAS DE AUTENTICAÇÃO E SESSÃO
app.post('/api/login', AuthController.login);
app.post('/api/alterar-senha', AuthController.alterarSenha);

// 👥 ROTAS DO MÓDULO DE USUÁRIOS / OPERADORES
app.get('/api/usuarios', UsuarioController.listar);
app.post('/api/usuarios', UsuarioController.cadastrar);
app.patch('/api/usuarios/:id', UsuarioController.atualizarFlag);
app.delete('/api/usuarios/:id', UsuarioController.deletar);

// 👥 ROTAS DO MÓDULO DE CLIENTES
app.get('/api/clientes', ClienteController.listar);
app.post('/api/clientes', ClienteController.cadastrar);
app.put('/api/clientes/:id', ClienteController.atualizar);
app.delete('/api/clientes/:id', ClienteController.deletar);

// 💵 🌟 ROTAS DO NOVO MÓDULO DE CREDIÁRIO PRÓPRIO E BAIXAS
app.get('/api/crediario/extrato', CrediarioController.obterExtrato);
app.post('/api/crediario/baixar', CrediarioController.baixarParcelas);

// 📟 ROTAS DO MÓDULO DE CAIXAS (PDV) E MONITORAMENTO
app.get('/api/crud-caixas', CaixaController.listar);
app.post('/api/crud-caixas', CaixaController.cadastrar);
app.patch('/api/crud-caixas/:id', CaixaController.alternarStatus);
app.get('/api/acompanhamento-caixas', CaixaController.monitoramentoRealtime);
app.get('/api/obter-vendas-periodo', CaixaController.extratoTurno);

// 🌟 ROTAS DO NOVO MÓDULO DE CONFIGURAÇÕES ADMINISTRATIVAS (EMPRESAS / FILIAIS / ACL / ESCÓPIOS)
app.get('/api/crud-empresas', ConfigController.listarEmpresas);
app.post('/api/crud-empresas', ConfigController.cadastrarEmpresa);
app.patch('/api/crud-empresas/:id', ConfigController.patchEmpresa);

app.get('/api/crud-filiais', ConfigController.listarFiliais);
app.post('/api/crud-filiais', ConfigController.cadastrarFilial);
app.patch('/api/crud-filiais/:id', ConfigController.patchFilial);

app.get('/api/crud-usuarios-acessos', ConfigController.listarAcessosPivo);
app.post('/api/crud-usuarios-acessos', ConfigController.vincularAcesso);
app.delete('/api/crud-usuarios-acessos/:id', ConfigController.revogarAcesso);

app.get('/api/gerenciar-menus', ConfigController.listarMenus);
app.post('/api/gerenciar-menus', ConfigController.cadastrarMenu);
app.patch('/api/gerenciar-menus/:id', ConfigController.patchMenu);

app.get('/api/gerenciar-permissoes', ConfigController.listarPermissoes);
app.post('/api/gerenciar-permissoes/alternar', ConfigController.alternarPermissao);

app.get('/api/tabelas-escopo', ConfigController.listarEscopos);
app.put('/api/tabelas-escopo/:tabela_nome', ConfigController.atualizarEscopo);

app.get('/api/relatorio-recebiveis', ConfigController.relatorioRecebiveis);

app.listen(PORT, () => {
    console.log(`🚀 API Gerencial Centralizada e Modularizada rodando em http://localhost:${PORT}`);
});