const API_URL = 'http://192.168.0.9:3000';

// Mantido para compatibilidade de telas antigas
export const tenantHeaders = {
    empresaId: '',
    filialId: '',
    usuarioId: ''
};

/**
 * Utilitário central de requisições HTTP do sistema gerencial
 */
export async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    // Configura os headers padrão
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // 1. RESOLVE DINAMICAMENTE A EMPRESA E A FILIAL ATIVAS
    const filialAtiva = localStorage.getItem('filialAtiva') || localStorage.getItem('empresaAtiva');
    let empresaId = tenantHeaders.empresaId;
    let filialId = tenantHeaders.filialId;
    
    if (filialAtiva) {
        try {
            const obj = JSON.parse(filialAtiva);
            empresaId = obj.empresa_id || obj.id || empresaId;
            filialId = obj.filial_id || obj.id || filialId;
        } catch (e) {
            if (filialAtiva !== 'undefined' && filialAtiva !== 'null') {
                empresaId = filialAtiva;
            }
        }
    }

    // 2. RESOLVE DINAMICAMENTE O USUÁRIO LOGADO (OPERADOR)
    const userStorage = localStorage.getItem('user') || localStorage.getItem('usuario');
    let usuarioId = tenantHeaders.usuarioId;

    if (userStorage) {
        try {
            const userObj = JSON.parse(userStorage);
            usuarioId = userObj.id || userObj.usuarioId || userObj.operadorId || usuarioId;
            if (userObj.empresa_id && !empresaId) empresaId = userObj.empresa_id;
            if (userObj.filial_id && !filialId) filialId = userObj.filial_id;
        } catch (e) {
            if (userStorage !== 'undefined' && userStorage !== 'null') {
                usuarioId = userStorage;
            }
        }
    }

    const caixaId = localStorage.getItem('caixaId') || 
                    localStorage.getItem('caixaAtivo') || 
                    JSON.parse(localStorage.getItem('caixa') || '{}')?.id || '';

    if (caixaId && caixaId !== 'undefined' && caixaId !== 'null') {
        headers['x-caixa-id'] = caixaId;
        headers['caixa-id'] = caixaId;
    }
    
    // Fallbacks de chaves de persistência direta
    if (!empresaId) empresaId = localStorage.getItem('empresaId') || '';
    if (!filialId) filialId = localStorage.getItem('filialId') || '';
    if (!usuarioId) usuarioId = localStorage.getItem('usuarioId') || localStorage.getItem('userId') || '';

    // 3. INJETA OS HEADERS TOTAIS DE GOVERNANÇA GLOBAL (Hífen e Underline para máxima compatibilidade)
    if (empresaId) {
        headers['x-empresa-id'] = empresaId;
        headers['empresa-id'] = empresaId;
    }
    if (filialId) {
        headers['x-filial-id'] = filialId;
        headers['filial-id'] = filialId;
    }
    if (usuarioId) {
        headers['x-usuario-id'] = usuarioId;
        headers['x-operador-id'] = usuarioId;
        headers['usuario-id'] = usuarioId;
    }

    // Normaliza o corpo da requisição para o fetch nativo
    let bodyData = options.body || options.data;
    if (bodyData && typeof bodyData === 'object') {
        bodyData = JSON.stringify(bodyData);
    }

    const config = {
        ...options,
        headers,
        body: bodyData
    };

    if (config.data) delete config.data;

    try {
        const resposta = await fetch(url, config);
        
        let dados = {};
        try {
            dados = await resposta.json();
        } catch (_) {
            dados = {};
        }

        if (!resposta.ok) {
            // Repassa a mensagem enviada pelo controller
            throw new Error(dados.erro || dados.mensagem || `Erro HTTP ${resposta.status}`);
        }

        return dados;
    } catch (error) {
        console.error('Erro na requisição:', error);
        // Se for um erro já tratado e retornado pela API, propaga-o diretamente
        if (error.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
            throw error;
        }
        throw new Error('Não foi possível conectar ao servidor de dados. Verifique se o serviço está ativo.');
    }
}