const API_URL = 'http://192.168.0.18:3000';

// Armazenadores dinâmicos para os cabeçalhos de Tenant de forma reativa/global
export const tenantHeaders = {
    empresaId: '',
    filialId: ''
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

    // Injeta automaticamente a governança se os IDs estiverem preenchidos
    if (tenantHeaders.empresaId) headers['x_empresa_id'] = tenantHeaders.empresaId;
    if (tenantHeaders.filialId) headers['x_filial_id'] = tenantHeaders.filialId;

    const config = {
        ...options,
        headers
    };

    const resposta = await fetch(url, config);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || 'Falha na comunicação com o servidor.');
    }

    return dados;
}