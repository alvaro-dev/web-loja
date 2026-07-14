<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 flex selection:bg-indigo-500 selection:text-white font-sans">
    
    <!-- ====================================================================== -->
    <!-- 🎛️ TELA 1: ÁREA DE AUTENTICAÇÃO (SÓ EXIBE SE NÃO ESTIVER LOGADO) -->
    <!-- ====================================================================== -->
    <div v-if="!sistemaLiberado" class="w-full flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
        
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-600/10 text-indigo-400 mb-4 border border-indigo-500/20 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6.75a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5V20.25a1.5 1.5 0 0 0 1.5 1.5Z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">SysLoja Gerencial</h2>
          <p class="text-sm text-slate-400 mt-1">Insira suas credenciais centrais para acessar</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          
          <div v-if="mensagemErro" class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{{ mensagemErro }}</span>
          </div>

          <div v-if="mensagemSucesso" class="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{{ mensagemSucesso }}</span>
          </div>

          <div>
            <label for="usuario" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Usuário</label>
            <input 
              id="usuario"
              v-model="form.usuario"
              type="text" 
              required
              placeholder="Ex: admin"
              class="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div>
            <label for="senha" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
            <input 
              id="senha"
              ref="senhaInput"
              v-model="form.senha"
              type="password" 
              required
              placeholder="••••••••"
              class="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <button 
            type="submit" 
            :disabled="carregando"
            class="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg v-if="carregando" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ carregando ? 'Autenticando...' : 'Entrar no Sistema' }}</span>
          </button>
        </form>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!-- 🏢 TELA 2: CORE DO SISTEMA (SIDEBAR DINÂMICA + CONTEÚDO PRINCIPAL) -->
    <!-- ====================================================================== -->
    <div v-else class="w-full flex min-h-screen">
      
      <!-- 🛠️ 1. SIDEBAR LATERAL -->
      <aside class="w-64 bg-slate-800 border-r border-slate-700/60 flex flex-col justify-between shrink-0">
        <div>
          <!-- Logo Superior da Sidebar -->
          <div class="h-16 flex items-center gap-3 px-6 border-b border-slate-700/60">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">S</div>
            <span class="font-bold text-white tracking-wide text-lg">SysLoja Web</span>
          </div>

          <!-- Lista de Menus Injetados Dinamicamente pelo Banco -->
          <nav class="p-4 space-y-1">
            <button 
              v-for="menu in listaMenus" 
              :key="menu.rota"
              @click="abaAtiva = menu.rota"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group',
                abaAtiva === menu.rota 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              ]"
            >
              <!-- Ícone Genérico Baseado no Nome Cadastrado -->
              <span class="w-5 h-5 shrink-0">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke-width="1.5" 
                  stroke="currentColor" 
                  class="w-5 h-5"
                  v-html="iconesMenu[menu.icone] || iconesMenu['DefaultIcon']"
                >
                </svg>
              </span>
              <span>{{ menu.titulo }}</span>
            </button>
          </nav>
        </div>

        <!-- Seção Inferior: Perfil e Logout -->
        <div class="p-4 border-t border-slate-700/60 bg-slate-900/30">
          <div class="flex items-center gap-3 px-2 py-1 mb-3">
            <div class="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-indigo-400 font-bold uppercase border border-slate-600">
              {{ usuarioLogado?.nome.substring(0, 2) }}
            </div>
            <div class="overflow-hidden">
              <p class="text-sm font-semibold text-white truncate">{{ usuarioLogado?.nome }}</p>
              <p class="text-xs text-indigo-400 capitalize truncate">{{ usuarioLogado?.role }}</p>
            </div>
          </div>
          <button 
            @click="efetuarLogout"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Sair do Sistema
          </button>
        </div>
      </aside>

      <!-- 🖥️ 2. PAINEL DE CONTEÚDO DINÂMICO -->
      <main class="flex-1 flex flex-col min-w-0 bg-slate-900">
        <!-- Barra de Topo -->
        <!--
        <header class="h-16 border-b border-slate-700/60 bg-slate-800/20 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          <h1 class="text-lg font-bold text-white">
            {{ listaMenus.find(m => m.rota === abaAtiva)?.titulo || 'Painel Central' }}
          </h1>
          <div class="text-xs text-slate-400 font-medium">
            Servidor de Dados: <span class="text-emerald-400 font-semibold">Conectado (PostgreSQL)</span>
          </div>
        </header>
        -->
        <!-- Barra de Topo Dinâmica com Seletores Multi-Empresa e Multi-Filial -->
        <header class="h-16 border-b border-slate-700/60 bg-slate-800/20 backdrop-blur-md px-8 flex items-center justify-between shrink-0 gap-4">
          <h1 class="text-lg font-bold text-white hidden md:block">
            {{ listaMenus.find(m => m.rota === abaAtiva)?.titulo || 'Painel Central' }}
          </h1>

          <!-- 🌟 SELETORES MULTI-TENANT -->
          <div class="flex flex-1 md:flex-none items-center gap-3 max-w-xl text-left">
            <!-- Select Empresa -->
            <div class="flex flex-col min-w-40">
              <label class="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Empresa / Grupo</label>
              <select 
                v-model="empresaAtivaId"
                :disabled="listaEmpresasDisponiveis.length <= 1"
                class="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option v-for="emp in listaEmpresasDisponiveis" :key="emp.id" :value="emp.id">
                  {{ emp.nome }}
                </option>
              </select>
            </div>

            <!-- Select Filial -->
            <div class="flex flex-col min-w-45">
              <label class="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Filial Ativa</label>
              <select 
                v-model="filialAtivaId"
                :disabled="listaFiliaisFiltradas.length <= 1"
                class="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option v-for="fil in listaFiliaisFiltradas" :key="fil.id" :value="fil.id">
                  {{ fil.nome }}
                </option>
              </select>
            </div>
          </div>
          <!--
          <div class="text-xs text-slate-400 font-medium hidden sm:block">
            Filtro Global: <span class="text-indigo-400 font-mono font-bold">{{ filialAtivaId.substring(0,8) }}...</span>
          </div>-->
          <div class="text-xs text-slate-400 font-medium">
            Servidor de Dados: <span class="text-emerald-400 font-semibold">Conectado</span>
          </div>
        </header>

        <!-- Área Interna Substituível -->
        <div class="p-8 flex-1 overflow-y-auto">
          <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl min-h-75 flex flex-col justify-center items-center text-center">
            
            <!-- Exemplo Simples de Roteamento Interno Dinâmico -->
            <div v-if="abaAtiva === '/dashboard'" class="space-y-2">
              <h3 class="text-xl font-bold text-white">📊 Painel de Controle Principal</h3>
              <p class="text-sm text-slate-400 max-w-md">Os gráficos centrais de vendas, tickets e faturamento do seu ecossistema aparecerão aqui.</p>
            </div>

            <!-- 👥 MÓDULO COMPLETO: GESTÃO DE USUÁRIOS (SUBSTITUIÇÃO DA DIV ANTIGA) -->
            <div v-else-if="abaAtiva === '/usuarios'" class="w-full text-left space-y-6">
              
              <!-- Topo do Módulo com Botão de Cadastro -->
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50">
                <div>
                  <h3 class="text-xl font-bold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-indigo-400"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0  4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                    Controle de Operadores e Acessos
                  </h3>
                  <p class="text-xs text-slate-400 mt-1">Gerencie logins gerenciais, usuários do PDV, bloqueios e redefinições de senha compulsórias.</p>
                </div>
                <button 
                  @click="abrirModalNovoUsuario"
                  class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-indigo-600/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Novo Usuário
                </button>
              </div>

              <!-- FEEDBACKS DO CRUD -->
              <div v-if="erroCrud" class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{{ erroCrud }}</div>
              <div v-if="sucessoCrud" class="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl">{{ sucessoCrud }}</div>

              <!-- TABELA DE USUÁRIOS REGISTRADOS -->
              <div class="overflow-hidden border border-slate-700/50 bg-slate-800/20 rounded-2xl shadow-xl">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-800/60 border-b border-slate-700/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th class="py-4 px-6">Nome Completo</th>
                      <th class="py-4 px-6">Usuário (Login)</th>
                      <th class="py-4 px-6">Perfil Gerencial</th>
                      <th class="py-4 px-6 text-center">Acesso PDV</th>
                      <th class="py-4 px-6 text-center">Bloqueado</th>
                      <th class="py-4 px-6 text-center">Forçar Troca Senha</th>
                      <th class="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-700/40 text-sm">
                    <tr v-if="listaUsuarios.length === 0" class="text-center text-slate-500"><td colspan="7" class="py-10">Nenhum operador encontrado no banco de dados.</td></tr>
                    <tr v-for="user in listaUsuarios" :key="user.id" class="hover:bg-slate-800/30 transition-colors">
                      <!-- Nome -->
                      <td class="py-4 px-6 font-medium text-white">{{ user.nome }}</td>
                      <!-- Login -->
                      <td class="py-4 px-6 text-slate-300 font-mono text-xs">{{ user.usuario }}</td>
                      <!-- Role -->
                      <td class="py-4 px-6">
                        <span :class="[
                          'px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide',
                          user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          user.role === 'gerente' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-700 text-slate-300'
                        ]">{{ user.role }}</span>
                      </td>
                      <!-- Flag PDV -->
                      <td class="py-4 px-6 text-center">
                        <button 
                          @click="alternarFlagUsuario(user.id, 'usuario_pdv', user.usuario_pdv === 'S' ? 'N' : 'S')"
                          :class="['px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors border', user.usuario_pdv === 'S' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700']"
                        >
                          {{ user.usuario_pdv === 'S' ? 'SIM' : 'NÃO' }}
                        </button>
                      </td>
                      <!-- Flag Bloqueado -->
                      <td class="py-4 px-6 text-center">
                        <button 
                          @click="alternarFlagUsuario(user.id, 'bloqueado', user.bloqueado === 'S' ? 'N' : 'S')"
                          :class="['px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors border', user.bloqueado === 'S' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-400 border-slate-700']"
                        >
                          {{ user.bloqueado === 'S' ? 'BLOQUEADO' : 'ATIVO' }}
                        </button>
                      </td>
                      <!-- Flag Forçar Senha -->
                      <td class="py-4 px-6 text-center">
                        <button 
                          @click="alternarFlagUsuario(user.id, 'trocar_senha_prox_login', user.trocar_senha_prox_login === 'S' ? 'N' : 'S')"
                          :class="['px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors border', user.trocar_senha_prox_login === 'S' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-500 border-slate-700']"
                        >
                          {{ user.trocar_senha_prox_login === 'S' ? 'PENDENTE' : 'OK' }}
                        </button>
                      </td>
                      <!-- Botão Excluir -->
                      <td class="py-4 px-6 text-right">
                        <button 
                          @click="excluirUsuarioCrud(user.id, user.nome)"
                          class="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                          title="Remover Usuário"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.34 6.14m-5.72 0L8.82 9m4.71-1.5L14.74 21H9.26L8.82 7.5M15 7.5a3 3 0 1 1-6 0M4.5 12h15" /></svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 🌟 MODAL INTERNO: FORMULÁRIO DE NOVO USUÁRIO -->
              <div v-if="mostrarModalCadastro" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-60">
                <div class="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
                  <h4 class="text-lg font-bold text-white border-b border-slate-700 pb-2">Cadastrar Novo Operador</h4>
                  
                  <form @submit.prevent="salvarNovoUsuario" class="space-y-4">
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Nome Completo</label>
                      <input v-model="formNovoUser.nome" type="text" required placeholder="Ex: João da Silva" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Usuário (Nome de Login)</label>
                      <input v-model="formNovoUser.usuario" type="text" required placeholder="Ex: joao.caixa" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono" />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Senha Inicial</label>
                      <input v-model="formNovoUser.senha" type="password" required placeholder="Defina uma senha provisória" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-semibold text-slate-400 mb-1">Perfil (Role)</label>
                        <select v-model="formNovoUser.role" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
                          <option value="operador">Operador</option>
                          <option value="gerente">Gerente</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-slate-400 mb-1">Acesso ao PDV?</label>
                        <select v-model="formNovoUser.usuario_pdv" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
                          <option value="S">Sim (Acessa PDV)</option>
                          <option value="N">Não (Apenas Web)</option>
                        </select>
                      </div>
                    </div>
                    <div class="flex gap-3 pt-2">
                      <button type="button" @click="mostrarModalCadastro = false" class="flex-1 bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer">Cancelar</button>
                      <button type="submit" class="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium cursor-pointer">Salvar No Banco</button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
            
            <!-- 📟 MÓDULO GERENCIAL: CRUD DE CAIXAS (PDV) -->
            <div v-else-if="abaAtiva === '/cadastro-caixas'" class="w-full text-left space-y-6 animate-fade-in">
              
              <!-- Topo Informativo -->
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50">
                <div>
                  <h3 class="text-xl font-bold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-indigo-400"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
                    Terminais de Caixas do PDV
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">Cadastre e vincule caixas físicos a filiais operacionais para amarrar o fluxo de faturamento das vendas.</p>
                </div>
                <button 
                  @click="abrirModalNovoCaixa"
                  class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Novo Caixa / PDV
                </button>
              </div>

              <!-- Tabela de Terminais Registrados -->
              <div class="overflow-hidden border border-slate-700/50 bg-slate-800/20 rounded-2xl shadow-xl">
                <table class="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr class="bg-slate-800/60 border-b border-slate-700/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th class="py-4 px-6">Identificação do Caixa</th>
                      <th class="py-4 px-6">Empresa do Grupo</th>
                      <th class="py-4 px-6">Filial Vinculada (Escopo de Venda)</th>
                      <th class="py-4 px-6 text-center">Situação</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-700/40">
                    <tr v-for="cx in listaCaixasPdv" :key="cx.id" class="hover:bg-slate-800/30 transition-colors">
                      <td class="py-4 px-6 font-semibold text-white flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" :class="cx.ativo ? 'bg-emerald-500' : 'bg-slate-600'"></span>
                        {{ cx.nome }}
                      </td>
                      <td class="py-4 px-6 text-slate-300">{{ cx.empresa_nome }}</td>
                      <td class="py-4 px-6 text-indigo-400 font-medium">{{ cx.filial_nome }}</td>
                      <td class="py-4 px-6 text-center">
                        <button 
                          @click="alternarStatusCaixa(cx.id, !cx.ativo)"
                          :class="['px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors border', cx.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700']"
                        >
                          {{ cx.ativo ? 'ATIVO' : 'INATIVO' }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="listaCaixasPdv.length === 0" class="text-center text-slate-500">
                      <td colspan="4" class="py-10 italic">Nenhum terminal de caixa localizado no banco de dados.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Modal Flutuante de Cadastro -->
              <div v-if="mostrarModalCaixa" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-70">
                <div class="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
                  <h4 class="text-lg font-bold text-white border-b border-slate-700 pb-2">Registrar Terminal PDV</h4>
                  
                  <form @submit.prevent="salvarCaixaPdv" class="space-y-4">
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Nome do Caixa</label>
                      <input v-model="formCaixa.nome" type="text" required placeholder="Ex: CAIXA CHECKOUT 01" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Empresa / Grupo</label>
                      <select v-model="formCaixa.empresa_id" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
                        <option value="" disabled>Selecione o Grupo...</option>
                        <option v-for="e in listaCrudEmpresas.filter(x => x.ativo)" :key="e.id" :value="e.id">{{ e.nome_fantasia }}</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Filial Responsável</label>
                      <select v-model="formCaixa.filial_id" required :disabled="!formCaixa.empresa_id" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm disabled:opacity-40">
                        <option value="" disabled>Selecione a Filial...</option>
                        <option v-for="f in listaCrudFiliais.filter(x => x.empresa_id === formCaixa.empresa_id && x.ativo)" :key="f.id" :value="f.id">{{ f.nome }}</option>
                      </select>
                    </div>
                    <div class="flex gap-3 pt-2">
                      <button type="button" @click="mostrarModalCaixa = false" class="flex-1 bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer">Cancelar</button>
                      <button type="submit" class="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium cursor-pointer">Ativar Terminal</button>
                    </div>
                  </form>
                </div>
              </div>

            </div>

            <!-- 📟 MÓDULO GERENCIAL: ACOMPANHAMENTO DE CAIXAS EM TEMPO REAL -->
            <div v-else-if="abaAtiva === '/acompanhamento-caixas'" class="w-full text-left space-y-6 animate-fade-in">
              <div class="flex flex-wrap items-center gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 justify-between">
                <div>
                  <h3 class="text-xl font-bold text-white flex items-center gap-2">
                    Monitoramento de Terminais (PDV)
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">Visão macro de movimentações financeiras por dia de abertura.</p>
                </div>
                
                <div class="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-1.5">
                  <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtrar Dia:</label>
                  <input 
                    type="date" 
                    v-model="filtroDataAcompanhamento" 
                    class="bg-transparent text-white text-sm outline-none cursor-pointer scheme:dark"
                  />
                </div>

                <button @click="carregarAcompanhamentoCaixas" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer">
                  Atualizar Dados
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="c in listaMonitoramentoCaixas" :key="c.movimento_id" @click="selecionarTurnoParaExtrato(c)" class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4 shadow-lg cursor-pointer transition-all hover:scale-[1.02]" :class="turnoSelecionadoAcompanhamento?.movimento_id === c.movimento_id ? 'ring-2 ring-indigo-500 bg-indigo-950/20 opacity-100' : (turnoSelecionadoAcompanhamento ? 'opacity-50' : 'opacity-100')">
                  <div class="flex justify-between items-center border-b border-slate-700/40 pb-3">
                    <div>
                      <h4 class="font-bold text-white text-base">{{ c.caixa_name || c.caixa_nome }}</h4>
                      <span class="text-[10px] text-slate-500 font-mono">ID: {{ c.caixa_id ? c.caixa_id.substring(0,8) : '—' }}...</span>
                    </div>
                    <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider', c.status === 'A' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400']">
                      {{ c.status === 'A' ? '🔓 Aberto' : '🔒 Fechado' }}
                    </span>
                  </div>
                  
                  <div class="space-y-2 text-xs">
                    <div class="flex justify-between"><span class="text-slate-400">Operador:</span><span class="text-slate-200 font-medium">{{ c.operador_abertura }}</span></div>
                    <div class="flex justify-between"><span class="text-slate-400">Aberto em:</span><span class="text-slate-300 font-mono">{{ c.data_abertura ? new Date(c.data_abertura).toLocaleString() : '—' }}</span></div>
                    <div v-if="c.status === 'F'" class="flex justify-between"><span class="text-slate-400">Fechado em:</span><span class="text-slate-400 font-mono">{{ c.data_fechamento ? new Date(c.data_fechamento).toLocaleString() : '—' }}</span></div>
                    
                    <div class="card-valores" style="margin-top: 15px; font-size: 14px; line-height: 1.8;">
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #888;">Fundo de Gaveta:</span>
                        <span style="font-weight: bold;">R$ {{ Number(c.valor_abertura).toFixed(2) }}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #888;">Movimentação Dinheiro (Gaveta):</span>
                        <span :style="{ color: c.dinheiro_turno >= 0 ? 'green' : 'red', fontWeight: 'bold' }">
                          {{ c.dinheiro_turno >= 0 ? '+' : '' }} R$ {{ Number(c.dinheiro_turno).toFixed(2) }}
                        </span>
                      </div>
                      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #444; padding-bottom: 6px; margin-bottom: 6px;">
                        <span style="color: #888;">Recebimentos Eletrônicos (CC/CD/Pix):</span>
                        <span style="color: #007bff; font-weight: bold;">
                          + R$ {{ Number(c.eletronico_turno).toFixed(2) }}
                        </span>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 15px;">
                        <span style="font-weight: bold; color: #fff;">Dinheiro Físico em Caixa:</span>
                        <span style="font-weight: bold; color: #28a745;">
                          R$ {{ (Number(c.valor_abertura) + Number(c.dinheiro_turno)).toFixed(2) }}
                        </span>
                      </div>
                      <div style="display: flex; justify-content: space-between; font-size: 15px; margin-top: 4px;">
                        <span style="font-weight: bold; color: #fff;">Faturamento Total Turno:</span>
                        <span style="font-weight: bold; color: #6f42c1;">
                          R$ {{ (Number(c.dinheiro_turno) + Number(c.eletronico_turno)).toFixed(2) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="listaMonitoramentoCaixas.length === 0" class="col-span-full py-10 italic text-slate-500">Nenhum caixa ativo mapeado nesta filial.</div>
              </div>

              <div v-if="turnoSelecionadoAcompanhamento" class="space-y-3 pt-4 border-t border-slate-700/60 animate-fade-in text-left">
                <h4 class="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                  <span>📋 Lançamentos do Dia:</span>
                  <span class="text-xs bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-bold uppercase">
                    {{ turnoSelecionadoAcompanhamento.caixa_name || turnoSelecionadoAcompanhamento.caixa_nome }} - Turno {{ turnoSelecionadoAcompanhamento.status === 'A' ? 'Atual' : 'Encerrado' }}
                  </span>
                </h4>

                <div class="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                  <table class="w-full text-sm text-left text-slate-300">
                    <thead class="text-xs uppercase bg-slate-700/60 text-slate-400 border-b border-slate-700/50">
                      <tr>
                        <th class="px-6 py-3.5">Hora</th>
                        <th class="px-6 py-3.5">Fluxo</th>
                        <th class="px-6 py-3.5">Forma</th>
                        <th class="px-6 py-3.5">Bandeira</th>
                        <th class="px-6 py-3.5 text-center">Parcelas</th>
                        <th class="px-6 py-3.5">Descrição / Motivo</th>
                        <th class="px-6 py-3.5 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/30">
                      <tr v-for="v in extratoVendasTurnoAcompanhamento" :key="v.id" class="hover:bg-slate-700/10 transition-colors">
                        <td class="px-6 py-3.5 font-mono text-slate-400">{{ new Date(v.data_venda).toLocaleTimeString() }}</td>
                        <td class="px-6 py-3.5">
                          <span :class="v.origem === 'E' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'">
                            {{ v.origem === 'E' ? '📥 Entrada' : '📤 Saída' }}
                          </span>
                        </td>
                        <td class="px-6 py-3.5 font-bold text-white">
                          {{ v.forma_pagamento === 'DN' ? 'Dinheiro' : v.forma_pagamento === 'CC' ? 'C. Crédito' : v.forma_pagamento === 'CD' ? 'C. Débito' : 'Pix' }}
                        </td>
                        <td class="px-6 py-3.5 text-slate-400">{{ v.bandeira || '—' }}</td>
                        <td class="px-6 py-3.5 text-center font-mono text-slate-400">{{ v.parcelas ? `${v.parcelas}x` : '—' }}</td>
                        <td class="px-6 py-3.5 text-slate-400 italic">{{ v.descricao_movimento || 'Venda de Balcão' }}</td>
                        <td class="px-6 py-3.5 text-right font-mono font-bold" :class="v.origem === 'E' ? 'text-emerald-400' : 'text-red-400'">
                          R$ {{ Number(v.total).toFixed(2) }}
                        </td>
                      </tr>
                      <tr v-if="!extratoVendasTurnoAcompanhamento.length">
                        <td colspan="7" class="px-6 py-8 text-center text-slate-500 italic">Nenhum lançamento efetuado neste turno até o momento.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <!-- 💳 MÓDULO FINANCEIRO: RELATÓRIO DE RECEBÍVEIS DE CARTÃO (CC) -->
            <div v-else-if="abaAtiva === '/recebiveis-cc'" class="w-full text-left space-y-6 animate-fade-in">
              
              <div class="flex flex-wrap justify-between items-center bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 gap-4">
                <div class="min-w-fit">
                  <h3 class="text-xl font-bold text-white flex items-center gap-2">
                    <!-- Ícone original mantido -->
                    Painel de Recebíveis de Cartão de Crédito
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">Mapeamento e agenda futura de faturamento eletrônico.</p>
                </div>
                
                <!-- 📅 INPUTS DE FILTRO DE PERÍODO (DE / ATÉ) -->
                <div class="flex items-center gap-4 bg-slate-900/40 border border-slate-700/80 rounded-xl px-4 py-2">
                  <div class="flex items-center gap-2">
                    <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Vencimento De:</label>
                    <input type="date" v-model="filtroCcDataInicio" class="bg-transparent text-white text-xs outline-none cursor-pointer scheme:dark" />
                  </div>
                  <div class="w-px h-4 bg-slate-700"></div>
                  <div class="flex items-center gap-2">
                    <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Até:</label>
                    <input type="date" v-model="filtroCcDataFim" class="bg-transparent text-white text-xs outline-none cursor-pointer scheme:dark" />
                  </div>
                </div>

                <button 
                  @click="carregarRelatorioRecebiveis"
                  class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer shrink-0 shadow-lg"
                >
                  Sincronizar Relatório
                </button>
              </div>

              <h4 class="text-sm font-bold text-slate-400 tracking-wider uppercase">📊 Consolidação em Tela por Bandeira</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                  v-for="b in dadosRecebiveis.resumoBandeiras" 
                  :key="b.bandeira"
                  @click="alternarFiltroBandeira(b.bandeira)"
                  class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4 shadow-lg border-l-4 cursor-pointer transition-all hover:scale-[1.02]"
                  :class="[
                    b.bandeira === 'Visa' ? 'border-l-blue-500' : b.bandeira === 'Mastercard' ? 'border-l-red-500' : 'border-l-indigo-500',
                    bandeiraSelecionadaFiltro === b.bandeira ? 'ring-2 ring-indigo-500 bg-indigo-950/30 opacity-100' : (bandeiraSelecionadaFiltro ? 'opacity-40' : 'opacity-90 hover:opacity-100')
                  ]"
                >
                  <div class="flex justify-between items-center">
                    <span class="font-extrabold text-white text-lg">{{ b.bandeira || 'Não Informada' }}</span>
                    <span class="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md font-mono">{{ b.total_parcelas }} parc.</span>
                  </div>

                  <div class="space-y-1.5 text-xs">
                    <div class="flex justify-between">
                      <span class="text-slate-400">💰 Já Recebido:</span>
                      <span class="text-emerald-400 font-mono font-bold">R$ {{ Number(b.total_recebido).toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between border-t border-slate-700/30 pt-1.5">
                      <span class="text-slate-300 font-medium">⏳ Saldo a Receber:</span>
                      <span class="text-indigo-400 font-mono font-extrabold">R$ {{ Number(b.total_a_receber).toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
                
                <div v-if="!dadosRecebiveis.resumoBandeiras?.length" class="col-span-full bg-slate-800/20 text-center py-8 text-slate-500 italic rounded-2xl border border-slate-800">
                  Nenhuma transação eletrônica localizada para esta filial no período.
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                  <span>📋 Agenda Futura de Recebimentos:</span>
                  <span 
                    :class="[
                      'text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase',
                      bandeiraSelecionadaFiltro ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-700/50 text-slate-300 border-slate-600'
                    ]"
                  >
                    {{ bandeiraSelecionadaFiltro ? `Filtrando por ${bandeiraSelecionadaFiltro}` : 'Exibindo Tudo' }}
                  </span>
                </h4>
                
                <div class="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                  <table class="w-full text-sm text-left text-slate-300">
                    <thead class="text-xs uppercase bg-slate-700/60 text-slate-400 border-b border-slate-700/50">
                      <tr>
                        <th class="px-6 py-3.5">Vencimento Previsto</th>
                        <th class="px-6 py-3.5">Bandeira</th>
                        <th class="px-6 py-3.5 text-center">Parcela</th>
                        <th class="px-6 py-3.5">Terminal Origem</th>
                        <th class="px-6 py-3.5 text-right">Valor Líquido</th>
                        <th class="px-6 py-3.5 text-center">Situação</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/30">
                      <tr v-for="p in parcelasFiltradasPorBandeira" :key="p.id" class="hover:bg-slate-700/10 transition-colors">
                        <td class="px-6 py-3.5 font-mono text-slate-300">{{ new Date(p.data_prevista_recebimento).toLocaleDateString() }}</td>
                        <td class="px-6 py-3.5 font-bold text-white">{{ p.bandeira }}</td>
                        <td class="px-6 py-3.5 text-center font-mono text-slate-400">{{ p.parcela_numero }} / {{ p.total_parcelas_venda }}</td>
                        <td class="px-6 py-3.5 text-slate-400">{{ p.caixa_nome }}</td>
                        <td class="px-6 py-3.5 text-right font-mono font-bold text-indigo-300">R$ {{ Number(p.valor_parcela).toFixed(2) }}</td>
                        <td class="px-6 py-3.5 text-center">
                          <span 
                            :class="[
                              'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                              p.status === 'R' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            ]"
                          >
                            {{ p.status === 'R' ? 'Liquidado' : 'Aguardando' }}
                          </span>
                        </td>
                      </tr>
                      
                      <tr v-if="!parcelasFiltradasPorBandeira.length">
                        <td colspan="6" class="px-6 py-8 text-center text-slate-500 italic">Nenhum lançamento encontrado para os critérios selecionados.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <!-- ====================================================================== -->
            <!-- 👥 MÓDULO: CONTROLE DE CLIENTES                                       -->
            <!-- ====================================================================== -->
            <div v-else-if="abaAtiva === '/clientes'" class="space-y-6">

              <!-- Cabeçalho e Ações Rápidas -->
              <div class="flex flex-wrap justify-between items-center bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 gap-4">
                <div>
                  <h3 class="text-xl font-bold text-white flex items-center gap-2">
                    Gestão de Clientes & Políticas de Crédito
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">Controle de limites de crediário próprio, cadastros e inadimplência.</p>
                </div>
                
                <div class="flex items-center gap-3">
                  <!-- Campo de Busca Dinâmica -->
                  <input 
                    type="text" 
                    v-model="filtroBuscaCliente"
                    placeholder="Buscar por Nome ou CPF..." 
                    class="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none w-64 focus:border-indigo-500 transition-colors"
                  />
                  <button 
                    @click="resetarFormCliente(); exibindoModalCliente = true"
                    class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    Novo Cliente
                  </button>
                </div>
              </div>

              <!-- Tabela Principal de Registros -->
              <div class="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-900/50 border-b border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
                        <th class="p-4">Nome Completo</th>
                        <th class="p-4">CPF</th>
                        <th class="p-4">Contato / WhatsApp</th>
                        <th class="p-4">Cidade/UF</th>
                        <th class="p-4">Limite Crediário</th>
                        <th class="p-4">Situação</th>
                        <th class="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/40 text-slate-200 text-sm">
                      <tr v-for="cl in listaClientes" :key="cl.id" class="hover:bg-slate-700/20 transition-colors">
                        <td class="p-4 font-medium text-white">{{ cl.nome }}</td>
                        <td class="p-4 font-mono text-xs text-slate-400">{{ cl.cpf || 'Não Informado' }}</td>
                        <td class="p-4">{{ cl.telefone || '-' }}</td>
                        <td class="p-4 text-slate-300">{{ cl.cidade ? `${cl.cidade}-${cl.estado}` : '-' }}</td>
                        <td class="p-4 font-semibold text-indigo-400">R$ {{ parseFloat(cl.limite_credito).toFixed(2) }}</td>
                        <td class="p-4">
                          <span 
                            :class="cl.bloqueado === 'S' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'"
                            class="px-2.5 py-1 rounded-full text-xs font-bold uppercase border"
                          >
                            {{ cl.bloqueado === 'S' ? 'Bloqueado' : 'Regular' }}
                          </span>
                        </td>
                        <td class="p-4 text-right space-x-2">
                          <button @click="iniciarEdicaoCliente(cl)" class="text-indigo-400 hover:text-indigo-300 text-xs font-medium cursor-pointer">Editar</button>
                          <button @click="excluirCliente(cl.id)" class="text-rose-400 hover:text-rose-300 text-xs font-medium cursor-pointer">Excluir</button>
                        </td>
                      </tr>
                      <tr v-if="listaClientes.length === 0">
                        <td colspan="7" class="p-8 text-center text-slate-500 text-xs uppercase font-mono">Nenhum cliente cadastrado ou localizado nesta busca.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 🔲 MODAL FORMULÁRIO DE CADASTRO/EDIÇÃO -->
              <div v-if="exibindoModalCliente" class="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
                <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  <!-- Modal Header -->
                  <div class="bg-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                    <h4 class="text-md font-bold text-white uppercase tracking-wide">
                      {{ editandoClienteId ? 'Atualizar Ficha do Cliente' : 'Cadastrar Novo Cliente' }}
                    </h4>
                    <button @click="exibindoModalCliente = false" class="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
                  </div>

                  <!-- Modal Body (Rolável) -->
                  <div class="p-6 space-y-5 overflow-y-auto flex-1 text-slate-300 text-xs">
                    
                    <!-- SEÇÃO 1: Dados Principais -->
                    <div>
                      <h5 class="text-indigo-400 font-bold uppercase tracking-wider text-[10px] mb-3">1. Identificação Básica</h5>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1 md:col-span-2">
                          <label class="font-semibold text-slate-400">Nome Completo *</label>
                          <input type="text" v-model="formCliente.nome" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" placeholder="Nome social ou completo" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="font-semibold text-slate-400">CPF</label>
                          <input type="text" v-model="formCliente.cpf" placeholder="000.000.000-00" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="font-semibold text-slate-400">RG</label>
                          <input type="text" v-model="formCliente.rg" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="font-semibold text-slate-400">Data de Nascimento</label>
                          <input type="date" v-model="formCliente.data_nascimento" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm scheme:dark" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="font-semibold text-slate-400">Telefone / WhatsApp</label>
                          <input type="text" v-model="formCliente.telefone" placeholder="(00) 00000-0000" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1 md:col-span-2">
                          <label class="font-semibold text-slate-400">E-mail</label>
                          <input type="email" v-model="formCliente.email" placeholder="cliente@email.com" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                      </div>
                    </div>

                    <!-- SEÇÃO 2: Endereço -->
                    <div class="border-t border-slate-700/60 pt-4">
                      <h5 class="text-indigo-400 font-bold uppercase tracking-wider text-[10px] mb-3">2. Endereço Residencial</h5>
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="flex flex-col gap-1 col-span-2 md:col-span-1">
                          <label class="font-semibold text-slate-400">CEP</label>
                          <input type="text" v-model="formCliente.cep" @blur="buscarCep" placeholder="00000-000" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1 col-span-2 md:col-span-3">
                          <label class="font-semibold text-slate-400">Logradouro / Rua</label>
                          <input type="text" v-model="formCliente.logradouro" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="font-semibold text-slate-400">Número</label>
                          <input type="text" v-model="formCliente.numero" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1 col-span-1 md:col-span-3">
                          <label class="font-semibold text-slate-400">Complemento</label>
                          <input type="text" v-model="formCliente.complemento" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1 col-span-2">
                          <label class="font-semibold text-slate-400">Bairro</label>
                          <input type="text" v-model="formCliente.bairro" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1 col-span-1 md:col-span-2">
                          <label class="font-semibold text-slate-400">Cidade</label>
                          <input type="text" v-model="formCliente.cidade" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="font-semibold text-slate-400">Estado (UF)</label>
                          <input type="text" maxlength="2" v-model="formCliente.estado" placeholder="MG" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm uppercase text-center" />
                        </div>
                      </div>
                    </div>

                    <!-- SEÇÃO 3: Políticas Financeiras -->
                    <div class="border-t border-slate-700/60 pt-4">
                      <h5 class="text-indigo-400 font-bold uppercase tracking-wider text-[10px] mb-3">3. Configurações de Crediário Próprio</h5>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex flex-col gap-1">
                          <label class="font-semibold text-slate-400">Limite Máximo Disponível (R$)</label>
                          <input type="number" step="0.01" v-model="formCliente.limite_credito" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-indigo-400 font-semibold outline-none focus:border-indigo-500 text-sm" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="font-semibold text-slate-400">Bloqueio Administrativo?</label>
                          <select v-model="formCliente.bloqueado" class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm">
                            <option value="N">Não (Ficha Liberada)</option>
                            <option value="S">Sim (Bloquear Vendas a Prazo)</option>
                          </select>
                        </div>
                        <div class="flex flex-col gap-1 md:col-span-3" v-if="formCliente.bloqueado === 'S'">
                          <label class="font-semibold text-rose-400">Motivo do Bloqueio Manual</label>
                          <textarea v-model="formCliente.motivo_bloqueio" rows="2" placeholder="Descreva o motivo administrativo do bloqueio..." class="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 text-sm resize-none"></textarea>
                        </div>
                      </div>
                    </div>

                  </div>

                  <!-- Modal Footer -->
                  <div class="bg-slate-900 px-6 py-4 border-t border-slate-700 flex justify-end gap-3 shrink-0">
                    <button 
                      @click="exibindoModalCliente = false" 
                      class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      @click="salvarCliente" 
                      class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors cursor-pointer shadow-lg"
                    >
                      {{ editandoClienteId ? 'Salvar Alterações' : 'Confirmar Cadastro' }}
                    </button>
                  </div>

                </div>
              </div>

            </div>

            <div v-else-if="abaAtiva === '/crediario'" class="w-full text-left">
              <CrediarioModulo />
            </div>

            <!-- 🧭 MÓDULO ADMINISTRATIVO: CRUD DE MENUS E PERMISSÕES (APENAS ADMIN) -->
            <!-- 🧭 MÓDULO ADMINISTRATIVO GLOBAL: CONFIGURAÇÕES (MENUS, EMPRESAS E FILIAIS) -->
            <div v-else-if="abaAtiva === '/config-menus' && usuarioLogado?.role === 'admin'" class="w-full text-left space-y-6 animate-fade-in">
              
              <!-- Sub-navegação interna (Menu de Abas Administrativas) -->
              <div class="flex border-b border-slate-700/60 gap-2">
                <button @click="subAbaConfig = 'menus'" :class="['px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer', subAbaConfig === 'menus' ? 'border-indigo-500 text-white bg-slate-800/40 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200']">Menus e Acessos (ACL)</button>
                <button @click="subAbaConfig = 'empresas'" :class="['px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer', subAbaConfig === 'empresas' ? 'border-indigo-500 text-white bg-slate-800/40 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200']">Empresas (Grupos)</button>
                <button @click="subAbaConfig = 'filiais'" :class="['px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer', subAbaConfig === 'filiais' ? 'border-indigo-500 text-white bg-slate-800/40 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200']">Filiais</button>
                <button @click="subAbaConfig = 'acessos'" :class="['px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer', subAbaConfig === 'acessos' ? 'border-indigo-500 text-white bg-slate-800/40 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200']">Acessos de Usuários</button>
              </div>

              <!-- ==================================================== -->
              <!-- SUB-ABA 1: MENUS E PERMISSÕES (CÓDIGO ANTERIOR REORGANIZADO) -->
              <!-- ==================================================== -->
              <div v-if="subAbaConfig === 'menus'" class="space-y-6 animate-fade-in">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <!-- Form Menu -->
                  <div class="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl h-fit space-y-4">
                    <h4 class="text-sm font-bold text-white">Novo Menu do Sistema</h4>
                    <form @submit.prevent="salvarNovoMenuCrud" class="space-y-3">
                      <div><label class="block text-xs font-semibold text-slate-400 mb-1">Título</label><input v-model="formMenu.titulo" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" /></div>
                      <div><label class="block text-xs font-semibold text-slate-400 mb-1">Rota</label><input v-model="formMenu.rota" type="text" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono" /></div>
                      <div class="grid grid-cols-2 gap-3">
                        <div><label class="block text-xs font-semibold text-slate-400 mb-1">Ícone</label><select v-model="formMenu.icone" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"><option value="HomeIcon">HomeIcon</option><option value="UsersIcon">UsersIcon</option><option value="CreditCardIcon">CreditCardIcon</option><option value="ChartBarIcon">ChartBarIcon</option><option value="AdjustmentsIcon">AdjustmentsIcon</option></select></div>
                        <div><label class="block text-xs font-semibold text-slate-400 mb-1">Ordem</label><input v-model="formMenu.ordem" type="number" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" /></div>
                      </div>
                      <button type="submit" class="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-xl cursor-pointer">Cadastrar Menu</button>
                    </form>
                  </div>
                  <!-- Tabela Menus -->
                  <div class="lg:col-span-2 border border-slate-700/50 bg-slate-800/20 rounded-2xl overflow-hidden shadow-xl">
                    <table class="w-full text-left"><thead class="bg-slate-800/60 text-slate-400 text-xs font-bold uppercase"><tr class="border-b border-slate-700/60"><th class="py-3 px-4">Menu / Rota</th><th class="py-3 px-4 text-center">Ordem</th><th class="py-3 px-4 text-center">Visível</th><th class="py-3 px-4 text-right">Ação</th></tr></thead><tbody class="divide-y divide-slate-700/40 text-xs"><tr v-for="m in listaTodosMenus" :key="m.id" :class="[m.deletado ? 'opacity-40 bg-red-950/5' : '']"><td class="py-3 px-4"><p class="font-medium text-white">{{ m.titulo }}</p><p class="text-slate-400 font-mono text-[11px]">{{ m.rota }}</p></td><td class="py-3 px-4 text-center font-mono">{{ m.ordem }}</td><td class="py-3 px-4 text-center"><button :disabled="m.deletado" @click="alternarFlagMenu(m.id, 'ativo', !m.ativo)" :class="['px-2 py-0.5 rounded text-[10px] font-bold border', m.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700']">{{ m.ativo ? 'ATIVO' : 'OCULTO' }}</button></td><td class="py-3 px-4 text-right"><button @click="alternarFlagMenu(m.id, 'deletado', !m.deletado)" class="text-slate-500 hover:text-red-400 p-1.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button></td></tr></tbody></table>
                  </div>
                </div>
                <!-- Matriz ACL -->
                <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6"><h4 class="text-sm font-bold text-white mb-3">Matriz de Controle de Perfis (ACL)</h4><table class="w-full text-left text-xs border-collapse"><thead class="bg-slate-800/40 text-slate-400 uppercase"><tr class="border-b border-slate-700/60"><th class="py-3 px-4">Módulo / Menu Ativo</th><th v-for="role in ['admin', 'gerente', 'operador']" :key="role" class="py-3 px-4 text-center capitalize">{{ role }}</th></tr></thead><tbody class="divide-y divide-slate-700/30"><tr v-for="menu in listaTodosMenus.filter(m => !m.deletado)" :key="menu.id"><td class="py-3 px-4 font-medium text-slate-200">{{ menu.titulo }} <span class="text-slate-500 block text-[10px]">{{ menu.rota }}</span></td><td v-for="role in ['admin', 'gerente', 'operador']" :key="role" class="py-3 px-4 text-center"><input type="checkbox" :checked="checarSeTemPermissao(role, menu.id)" @change="ajustarMatrizPermissao(role, menu.id, $event.target.checked)" class="w-4 h-4 accent-indigo-500" /></td></tr></tbody></table></div>
              </div>

              <!-- ==================================================== -->
              <!-- 🌟 SUB-ABA 2: CRUD DE EMPRESAS (GRUPOS) -->
              <!-- ==================================================== -->
              <div v-else-if="subAbaConfig === 'empresas'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <!-- Form Cadastro Empresa -->
                <div class="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl h-fit space-y-4">
                  <h4 class="text-sm font-bold text-white">Cadastrar Nova Empresa Matriz</h4>
                  <form @submit.prevent="salvarEmpresaCrud" class="space-y-3">
                    <div><label class="block text-xs font-semibold text-slate-400 mb-1">Nome Fantasia comercial</label><input v-model="formEmpresa.nome_fantasia" type="text" required placeholder="Ex: Mercado Alvorada" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" /></div>
                    <div><label class="block text-xs font-semibold text-slate-400 mb-1">Razão Social Jurídica</label><input v-model="formEmpresa.razao_social" type="text" required placeholder="Ex: Alvorada Alimentos Ltda" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" /></div>
                    <div><label class="block text-xs font-semibold text-slate-400 mb-1">CNPJ</label><input v-model="formEmpresa.cnpj" type="text" placeholder="00.000.000/0001-00" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" /></div>
                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer transition-colors">Salvar Grupo</button>
                  </form>
                </div>
                <!-- Listagem Empresas -->
                <div class="lg:col-span-2 border border-slate-700/50 bg-slate-800/20 rounded-2xl overflow-hidden shadow-xl">
                  <table class="w-full text-left text-xs"><thead class="bg-slate-800/60 text-slate-400 font-bold uppercase"><tr class="border-b border-slate-700/60"><th class="py-3 px-4">Empresa / Razão Social</th><th class="py-3 px-4">CNPJ</th><th class="py-3 px-4 text-center">Status</th><th class="py-3 px-4 text-right">Remover</th></tr></thead><tbody class="divide-y divide-slate-700/40"><tr v-for="emp in listaCrudEmpresas" :key="emp.id"><td class="py-3 px-4"><p class="font-bold text-white text-sm">{{ emp.nome_fantasia }}</p><p class="text-slate-400 text-[11px]">{{ emp.razao_social }}</p></td><td class="py-3 px-4 font-mono text-slate-300">{{ emp.cnpj || 'Não informado' }}</td><td class="py-3 px-4 text-center"><button @click="alternarFlagEmpresa(emp.id, 'ativo', !emp.ativo)" :class="['px-2.5 py-0.5 rounded font-bold border', emp.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700']">{{ emp.ativo ? 'ATIVO' : 'INATIVO' }}</button></td><td class="py-3 px-4 text-right"><button @click="alternarFlagEmpresa(emp.id, 'deletado', true)" class="text-slate-500 hover:text-red-400 p-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.34 6.14m-5.72 0L8.82 9m4.71-1.5L14.74 21H9.26L8.82 7.5" /></svg></button></td></tr></tbody></table>
                </div>
              </div>

              <!-- ==================================================== -->
              <!-- 🌟 SUB-ABA 3: CRUD DE FILIAIS -->
              <!-- ==================================================== -->
              <div v-else-if="subAbaConfig === 'filiais'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <!-- Form Cadastro Filial -->
                <div class="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl h-fit space-y-4">
                  <h4 class="text-sm font-bold text-white">Cadastrar Nova Filial Operacional</h4>
                  <form @submit.prevent="salvarFilialCrud" class="space-y-3">
                    <div><label class="block text-xs font-semibold text-slate-400 mb-1">Vincular à Empresa Mãe</label><select v-model="formFilial.empresa_id" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"><option value="" disabled>Selecione uma empresa...</option><option v-for="e in listaCrudEmpresas.filter(x => x.ativo)" :key="e.id" :value="e.id">{{ e.nome_fantasia }}</option></select></div>
                    <div><label class="block text-xs font-semibold text-slate-400 mb-1">Nome Identificador da Filial</label><input v-model="formFilial.nome" type="text" required placeholder="Ex: Filial Centro Shopping" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" /></div>
                    <div><label class="block text-xs font-semibold text-slate-400 mb-1">CNPJ da Filial</label><input v-model="formFilial.cnpj" type="text" placeholder="00.000.000/0002-00" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" /></div>
                    <div class="grid grid-cols-3 gap-2">
                      <div class="col-span-2"><label class="block text-xs font-semibold text-slate-400 mb-1">Cidade</label><input v-model="formFilial.cidade" type="text" placeholder="Ex: Campinas" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" /></div>
                      <div><label class="block text-xs font-semibold text-slate-400 mb-1">UF</label><input v-model="formFilial.estado" type="text" maxlength="2" placeholder="SP" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm uppercase" /></div>
                    </div>
                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer transition-colors">Salvar Filial</button>
                  </form>
                </div>
                <!-- Listagem Filiais -->
                <div class="lg:col-span-2 border border-slate-700/50 bg-slate-800/20 rounded-2xl overflow-hidden shadow-xl">
                  <table class="w-full text-left text-xs"><thead class="bg-slate-800/60 text-slate-400 font-bold uppercase"><tr class="border-b border-slate-700/60"><th class="py-3 px-4">Filial / Grupo Vinculado</th><th class="py-3 px-4">Cidade</th><th class="py-3 px-4 text-center">Status</th><th class="py-3 px-4 text-right">Remover</th></tr></thead><tbody class="divide-y divide-slate-700/40"><tr v-for="fil in listaCrudFiliais" :key="fil.id"><td class="py-3 px-4"><p class="font-bold text-white text-sm">{{ fil.nome }}</p><p class="text-slate-400 text-[11px]">Empresa: <span class="text-indigo-400 font-medium">{{ fil.empresa_nome }}</span></p></td><td class="py-3 px-4 text-slate-300 font-medium">{{ fil.cidade ? `${fil.cidade} - ${fil.estado}` : 'Não informado' }}</td><td class="py-3 px-4 text-center"><button @click="alternarFlagFilial(fil.id, 'ativo', !fil.ativo)" :class="['px-2.5 py-0.5 rounded font-bold border', fil.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700']">{{ fil.ativo ? 'ATIVO' : 'INATIVO' }}</button></td><td class="py-3 px-4 text-right"><button @click="alternarFlagFilial(fil.id, 'deletado', true)" class="text-slate-500 hover:text-red-400 p-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.34 6.14m-5.72 0L8.82 9m4.71-1.5L14.74 21H9.26L8.82 7.5" /></svg></button></td></tr></tbody></table>
                </div>
              </div>

              <div v-else-if="subAbaConfig === 'acessos'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                <div class="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl h-fit space-y-4">
                  <div>
                    <h4 class="text-sm font-bold text-white">Liberar Filial para Usuário</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Defina em quais lojas o usuário pode se conectar.</p>
                  </div>
                  <form @submit.prevent="salvarAcessoUsuarioCrud" class="space-y-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Selecionar Usuário</label>
                      <select v-model="formAcesso.usuario_id" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
                        <option value="" disabled>Escolha o funcionário...</option>
                        <option v-for="u in listaUsuarios" :key="u.id" :value="u.id">{{ u.nome }} ({{ u.usuario }})</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Empresa / Grupo</label>
                      <select v-model="formAcesso.empresa_id" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
                        <option value="" disabled>Selecione a Empresa...</option>
                        <option v-for="e in listaCrudEmpresas.filter(x => x.ativo)" :key="e.id" :value="e.id">{{ e.nome_fantasia }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-xs font-semibold text-slate-400 mb-1">Filial Liberada</label>
                      <select v-model="formAcesso.filial_id" required :disabled="!formAcesso.empresa_id" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm disabled:opacity-40">
                        <option value="" disabled>Selecione a Filial...</option>
                        <option v-for="f in listaCrudFiliais.filter(x => x.empresa_id === formAcesso.empresa_id && x.ativo)" :key="f.id" :value="f.id">{{ f.nome }}</option>
                      </select>
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                      <input id="chkPadrao" type="checkbox" v-model="formAcesso.padrao" class="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 accent-indigo-500 cursor-pointer" />
                      <label for="chkPadrao" class="text-xs text-slate-300 font-medium cursor-pointer select-none">Definir como filial padrão no login</label>
                    </div>

                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer transition-colors shadow-lg">
                      Vincular Acesso
                    </button>
                  </form>
                </div>

                <div class="lg:col-span-2 border border-slate-700/50 bg-slate-800/20 rounded-2xl overflow-hidden shadow-xl">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-slate-800/60 text-slate-400 font-bold uppercase border-b border-slate-700/60">
                      <tr>
                        <th class="py-3 px-4">Usuário</th>
                        <th class="py-3 px-4">Empresa / Filial Autorizada</th>
                        <th class="py-3 px-4 text-center">Inicial (Login)</th>
                        <th class="py-3 px-4 text-right">Revogar</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/40">
                      <tr v-for="ac in listaCrudAcessosUsuarios" :key="ac.id" class="hover:bg-slate-800/10">
                        <td class="py-3 px-4">
                          <p class="font-bold text-white">{{ ac.usuario_nome }}</p>
                          <p class="text-slate-400 text-[11px] font-mono">@{{ ac.usuario_login }}</p>
                        </td>
                        <td class="py-3 px-4">
                          <p class="text-slate-200 font-medium">{{ ac.filial_nome }}</p>
                          <p class="text-[11px] text-slate-400">Grupo: {{ ac.empresa_nome }}</p>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span v-if="ac.padrao" class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            PADRÃO
                          </span>
                          <span v-else class="text-slate-600 text-[10px] font-medium">-</span>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <button @click="revogarAcessoUsuario(ac.id)" class="text-slate-500 hover:text-red-400 p-2 cursor-pointer transition-colors" title="Revogar Permissão">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="listaCrudAcessosUsuarios.length === 0">
                        <td colspan="4" class="py-8 text-center text-slate-500 italic">Nenhum vínculo customizado configurado.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <!-- 🧠 MÓDULO GERENCIAL: CONFIGURAÇÃO DE ESCOPOS DAS TABELAS -->
            <div v-else-if="abaAtiva === '/configuracoes-escopo'" class="w-full text-left space-y-6 animate-fade-in">
              
              <div class="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50">
                <h3 class="text-xl font-bold text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-indigo-400"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.956 11.959 0 0 1 12 2.714Z" /></svg>
                  Diretrizes de Escopo Multi-Tenant
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">Defina se os dados de cada módulo serão isolados estritamente por filial ou compartilhados entre toda a rede de lojas.</p>
              </div>

              <!-- TABELA DE CONFIGURAÇÃO DIRETA -->
              <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                <table class="w-full text-sm text-left text-slate-300">
                  <thead class="text-xs uppercase bg-slate-700/50 text-slate-400 border-b border-slate-700/60">
                    <tr>
                      <th class="px-6 py-4">Nome da Tabela Técnico</th>
                      <th class="px-6 py-4">Módulo Relacionado</th>
                      <th class="px-6 py-4 text-center">Regra de Escopo Atual</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-700/40">
                    <tr v-for="t in listaEscopoTabelas" :key="t.tabela_nome" class="hover:bg-slate-700/20 transition-colors">
                      <td class="px-6 py-4 font-mono font-bold text-indigo-300">{{ t.tabela_nome }}</td>
                      <td class="px-6 py-4 text-slate-200 font-medium">
                        {{ 
                          t.tabela_nome === 'caixas' ? 'Terminais Físicos do PDV' :
                          t.tabela_nome === 'movimentos_caixa' ? 'Turnos (Abertura/Fechamento)' :
                          t.tabela_nome === 'vendas' ? 'Movimentações e Cupons Fiscais' :
                          t.tabela_nome === 'recebiveis_cartao' ? 'Financeiro de Cartões (Projeção)' :
                          t.tabela_nome === 'produtos' ? 'Catálogo de Itens e Almoxarifado' :
                          t.tabela_nome === 'clientes' ? 'Carteira de Clientes Cadastrados' :
                          t.tabela_nome === 'fornecedores' ? 'Parceiros Comerciais / Indústrias' : 'Módulo do Sistema'
                        }}
                      </td>
                      <td class="px-6 py-4 flex justify-center">
                        <select 
                          v-model="t.escopo" 
                          @change="alterarEscopoTabela(t.tabela_nome, t.escopo)"
                          class="bg-slate-900 text-white font-semibold text-xs rounded-xl border border-slate-700 p-2 cursor-pointer focus:outline-none focus:border-indigo-500 min-w-45"
                          :class="t.escopo === 'EXCLUSIVO' ? 'text-amber-400 border-amber-500/30' : 'text-emerald-400 border-emerald-500/30'"
                        >
                          <option value="EXCLUSIVO">🔒 EXCLUSIVO (Por Filial)</option>
                          <option value="COMPARTILHADO">🌐 COMPARTILHADO (Grupo)</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            <div v-else-if="abaAtiva === '/caixas'" class="space-y-2">
              <h3 class="text-xl font-bold text-white">💳 Acompanhamento de Caixas</h3>
              <p class="text-sm text-slate-400 max-w-md">Módulo web para monitorar as movimentações de aberturas, sangrias e fechamentos dos PDVs físicos.</p>
            </div>

            <div v-else class="space-y-2">
              <h3 class="text-xl font-bold text-white">📁 Módulo Em Desenvolvimento</h3>
              <p class="text-sm text-slate-400">Você está navegando na rota ativa: <code class="bg-slate-900 px-2 py-0.5 rounded text-indigo-400 font-mono">{{ abaAtiva }}</code></p>
            </div>

          </div>
        </div>
      </main>
    </div>

    <!-- ====================================================================== -->
    <!-- 🔒 OBRIGATÓRIO: MODAL FLUTUANTE DE TROCA DE SENHA -->
    <!-- ====================================================================== -->
    <div v-if="exibirModalSenha" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
        
        <div class="flex items-start gap-3 text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 shrink-0 mt-0.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
          </svg>
          <div>
            <h3 class="text-lg font-bold text-white">Alteração de Senha Obrigatória</h3>
            <p class="text-xs text-slate-400 mt-1">O administrador solicitou que você redefina sua senha no primeiro login.</p>
          </div>
        </div>

        <div v-if="erroModal" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
          {{ erroModal }}
        </div>

        <form @submit.prevent="handleAlterarSenha" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Senha Atual</label>
            <input v-model="formSenha.antiga" type="password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Nova Senha</label>
            <input v-model="formSenha.nova" type="password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Confirmar Nova Senha</label>
            <input v-model="formSenha.confirmacao" type="password" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="cancelarTrocaSenha" class="flex-1 bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-medium cursor-pointer">Cancelar</button>
            <button type="submit" :disabled="guardandoSenha" class="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2">
              {{ guardandoSenha ? 'Salvando...' : 'Confirmar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, nextTick, markRaw, watch, computed } from 'vue'; // 🌟 Ajustado: Adicionado 'computed' que estava faltando
import { storeToRefs } from 'pinia'; 
//import CrediarioModulo from '@/components/CrediarioModulo.vue';
import CrediarioModulo from './components/CrediarioModulo.vue';

// 🌟 IMPORTAÇÃO DAS STORES DO PINIA
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';

import AuthService from '@/services/AuthService';
import ClienteService from '@/services/ClienteService';
import UsuarioService from '@/services/UsuarioService';
import CaixaService from '@/services/CaixaService';
import ConfigService from '@/services/ConfigService';

// Inicializa as stores locais
const authStore = useAuthStore();
const tenantStore = useTenantStore();

// Desestrutura propriedades e getters reativos usando storeToRefs
const { sistemaLiberado, usuarioLogado, listaMenus } = storeToRefs(authStore);
const { empresaAtivaId, filialAtivaId, listaEmpresasDisponiveis, listaFiliaisFiltradas } = storeToRefs(tenantStore);

// Elementos e Estados de Controle Visual
const senhaInput = ref(null);
const abaAtiva = ref('');
const subAbaConfig = ref('menus'); 
const listaCrudEmpresas = ref([]);
const listaCrudFiliais = ref([]);

const formEmpresa = reactive({ razao_social: '', nome_fantasia: '', cnpj: '' });
const formFilial = reactive({ empresa_id: '', nome: '', cnpj: '', cidade: '', estado: '' });

// GESTÃO DE OPERADORES VIA SERVICE
const listaUsuarios = ref([]);
const mostrarModalCadastro = ref(false);
const erroCrud = ref('');
const sucessoCrud = ref('');
const formNovoUser = reactive({ nome: '', usuario: '', senha: '', role: 'operador', usuario_pdv: 'S' });

// MENUS E ACL VIA SERVICE
const listaTodosMenus = ref([]);
const matrizPermissoes = ref([]);
const formMenu = reactive({ titulo: '', rota: '', icone: 'HomeIcon', ordem: 0 });

// VÍNCULO DE LOJAS VIA SERVICE
const listaCrudAcessosUsuarios = ref([]);
const formAcesso = reactive({ usuario_id: '', empresa_id: '', filial_id: '', padrao: false });

// GESTÃO DE TERMINAIS VIA SERVICE
const listaCaixasPdv = ref([]);
const mostrarModalCaixa = ref(false);
const formCaixa = reactive({ nome: '', empresa_id: '', filial_id: '' });

// MONITORAMENTO REALTIME VIA SERVICE
const listaMonitoramentoCaixas = ref([]);
const filtroDataAcompanhamento = ref(new Date().toISOString().split('T')[0]);
const turnoSelecionadoAcompanhamento = ref(null);
const extratoVendasTurnoAcompanhamento = ref([]);

// GOVERNANÇA DE TENANT VIA SERVICE
const listaEscopoTabelas = ref([]);

// FINANCEIRO DE CARTÕES VIA SERVICE
const dadosRecebiveis = ref({ resumoBandeiras: [], extratoParcelas: [] });
const bandeiraSelecionadaFiltro = ref(''); 
const filtroCcDataInicio = ref(new Date().toISOString().split('T')[0]);
const filtroCcDataFim = ref(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

// CLIENTES & VIACEP VIA SERVICE
const listaClientes = ref([]);
const filtroBuscaCliente = ref('');
const exibindoModalCliente = ref(false);
const editandoClienteId = ref(null);
const formCliente = ref({
  nome: '', cpf: '', rg: '', data_nascimento: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  limite_credito: 0, bloqueado: 'N', motivo_bloqueio: ''
});

// Controles do Login
const form = reactive({ usuario: '', senha: '' });
const carregando = ref(false);
const mensagemErro = ref('');
const mensagemSucesso = ref('');

const exibirModalSenha = ref(false);
const guardandoSenha = ref(false);
const erroModal = ref('');
const formSenha = reactive({ antiga: '', nova: '', confirmacao: '' });

// MÉTODOS DO CRUD DE EMPRESAS VIA SERVICE
async function carregarEmpresasCrud() {
  try { listaCrudEmpresas.value = await ConfigService.listarEmpresas(); } catch (err) { console.error(err); }
}

async function salvarEmpresaCrud() {
  try {
    await ConfigService.salvarEmpresa(formEmpresa);
    formEmpresa.razao_social = ''; formEmpresa.nome_fantasia = ''; formEmpresa.cnpj = '';
    await carregarEmpresasCrud();
  } catch (err) { alert(err.message); }
}

async function alternarFlagEmpresa(id, campo, valor) {
  if (campo === 'deletado' && !confirm('Deseja realmente remover esta empresa do sistema?')) return;
  try {
    await ConfigService.alternarFlagEmpresa(id, campo, valor);
    await carregarEmpresasCrud();
  } catch (err) { console.error(err); }
}

// MÉTODOS DO CRUD DE FILIAIS VIA SERVICE
async function carregarFiliaisCrud() {
  try { listaCrudFiliais.value = await ConfigService.listarFiliais(); } catch (err) { console.error(err); }
}

async function salvarFilialCrud() {
  try {
    await ConfigService.salvarFilial(formFilial);
    formFilial.nome = ''; formFilial.cnpj = ''; formFilial.cidade = ''; formFilial.estado = '';
    await carregarFiliaisCrud();
  } catch (err) { alert(err.message); }
}

async function alternarFlagFilial(id, campo, valor) {
  if (campo === 'deletado' && !confirm('Deseja realmente remover esta filial do sistema?')) return;
  try {
    await ConfigService.alternarFlagFilial(id, campo, valor);
    await carregarFiliaisCrud();
  } catch (err) { console.error(err); }
}

// 🌟 ESTADO DE USUÁRIO LOGADO TEMPORÁRIO LOCAL PARA REDEFINIÇÃO DE SENHA OBRIGATÓRIA
const usuarioTemporarioTrocaSenha = ref(null);

// GESTÃO DE SESSÃO OTIMIZADA COM PINIA
async function handleLogin() {
  carregando.value = true;
  mensagemErro.value = '';
  mensagemSucesso.value = '';

  try {
    const dados = await AuthService.login(form.usuario, form.senha);

    if (dados.usuario.trocarSenha) {
      // 🌟 CORRIGIDO: Atribui a um estado local para evitar a mutação de computada/refs diretas do Pinia
      usuarioTemporarioTrocaSenha.value = dados.usuario; 
      formSenha.antiga = form.senha;
      formSenha.nova = ''; formSenha.confirmacao = '';
      erroModal.value = '';
      exibirModalSenha.value = true;
      return;
    }

    authStore.definirSessao(dados);
    
    if (dados.menus.length > 0) abaAtiva.value = dados.menus[0].rota;

    if (dados.menus.some(m => m.rota === '/usuarios')) carregarUsuariosBanco();
    if (dados.menus.some(m => m.rota === '/config-menus')) {
      carregarMenusAdministrativos();
      carregarEmpresasCrud(); 
      carregarFiliaisCrud();  
      carregarAcessosUsuariosCrud(); 
    }
    if (dados.menus.some(m => m.rota === '/cadastro-caixas')) {
      carregarCaixasPdvCrud();
      carregarEmpresasCrud();
      carregarFiliaisCrud();
    }
    if (dados.menus.some(m => m.rota === '/acompanhamento-caixas')) carregarAcompanhamentoCaixas();
    if (dados.menus.some(m => m.rota === '/configuracoes-escopo')) carregarDicionarioEscopos();

    mensagemSucesso.value = `Logado com sucesso! Carregando...`;
    setTimeout(() => {
      form.usuario = ''; form.senha = '';
      mensagemSucesso.value = '';
    }, 800);

  } catch (error) {
    mensagemErro.value = error.message;
    form.senha = '';
    nextTick(() => { if (senhaInput.value) senhaInput.value.focus(); });
  } finally {
    carregando.value = false; 
  }
}

async function handleAlterarSenha() {
  erroModal.value = '';
  if (formSenha.nova !== formSenha.confirmacao) return erroModal.value = 'A nova senha e a confirmação não batem.';
  if (formSenha.nova.length < 4) return erroModal.value = 'A nova senha deve ter pelo menos 4 caracteres.';

  guardandoSenha.value = true;
  try {
    const idUsuario = usuarioTemporarioTrocaSenha.value?.id || usuarioLogado.value?.id;
    await AuthService.alterarSenha(idUsuario, formSenha.antiga, formSenha.nova);
    mensagemSucesso.value = 'Senha alterada com sucesso! Faça login.';
    exibirModalSenha.value = false;
    form.usuario = ''; form.senha = '';
    authStore.limparSessao();
  } catch (error) {
    erroModal.value = error.message;
  } finally { guardandoSenha.value = false; }
}

function cancelarTrocaSenha() { exibirModalSenha.value = false; authStore.limparSessao(); form.senha = ''; }
function efetuarLogout() {
  authStore.limparSessao();
  abaAtiva.value = '';
}

async function carregarUsuariosBanco() {
  try { listaUsuarios.value = await UsuarioService.listarUsuarios(); } catch (error) { erroCrud.value = error.message; }
}

function abrirModalNovoUsuario() {
  formNovoUser.nome = ''; formNovoUser.usuario = ''; formNovoUser.senha = ''; formNovoUser.role = 'operador'; formNovoUser.usuario_pdv = 'S';
  erroCrud.value = ''; sucessoCrud.value = ''; mostrarModalCadastro.value = true;
}

async function salvarNovoUsuario() {
  erroCrud.value = ''; sucessoCrud.value = '';
  try {
    const dados = await UsuarioService.cadastrarUsuario(formNovoUser);
    sucessoCrud.value = dados.mensagem;
    mostrarModalCadastro.value = false;
    await carregarUsuariosBanco();
  } catch (error) { alert(`Erro: ${error.message}`); }
}

async function alternarFlagUsuario(id, campo, valor) {
  erroCrud.value = ''; sucessoCrud.value = '';
  try {
    await UsuarioService.alternarFlag(id, campo, valor);
    await carregarUsuariosBanco();
  } catch (error) { erroCrud.value = error.message; }
}

async function excluirUsuarioCrud(id, nome) {
  if (!confirm(`Tem certeza de que deseja remover o acesso de "${nome}"?`)) return;
  erroCrud.value = ''; sucessoCrud.value = '';
  try {
    await UsuarioService.excluir(id);
    sucessoCrud.value = `O usuário "${nome}" foi removido com sucesso.`;
    await carregarUsuariosBanco();
  } catch (error) { erroCrud.value = error.message; }
}

async function carregarMenusAdministrativos() {
  try {
    listaTodosMenus.value = await ConfigService.listarMenusACL();
    matrizPermissoes.value = await ConfigService.obterMatrizPermissoes();
  } catch (error) { console.error('Falha ao sincronizar painel ACL:', error); }
}

async function salvarNovoMenuCrud() {
  try {
    const dados = await ConfigService.salvarMenuACL(formMenu);
    formMenu.titulo = ''; formMenu.rota = ''; formMenu.ordem = 0;
    alert(dados.mensagem);
    await carregarMenusAdministrativos();
  } catch (error) { alert(error.message); }
}

async function alternarFlagMenu(id, campo, valor) {
  try {
    await ConfigService.alternarFlagMenu(id, campo, valor);
    await carregarMenusAdministrativos();
  } catch (error) { console.error(error); }
}

function checarSeTemPermissao(role, menuId) { return matrizPermissoes.value.some(p => p.role === role && p.menu_id === menuId); }

async function ajustarMatrizPermissao(role, menuId, concedido) {
  try {
    await ConfigService.alternarPermissaoACL(role, menuId, concedido);
    matrizPermissoes.value = await ConfigService.obterMatrizPermissoes();
  } catch (error) { console.error(error); }
}

watch(() => formAcesso.empresa_id, () => { formAcesso.filial_id = ''; });

async function carregarAcessosUsuariosCrud() {
  try { listaCrudAcessosUsuarios.value = await UsuarioService.listarAcessosUsuarios(); } catch (err) { console.error(err); }
}

async function salvarAcessoUsuarioCrud() {
  try {
    const dados = await UsuarioService.vincularAcesso(formAcesso);
    formAcesso.usuario_id = ''; formAcesso.empresa_id = ''; formAcesso.filial_id = ''; formAcesso.padrao = false;
    alert(dados.mensagem);
    await carregarAcessosUsuariosCrud();
  } catch (err) { alert(err.message); }
}

async function revogarAcessoUsuario(id) {
  if (!confirm('Deseja realmente retirar a permissão de acesso deste usuário?')) return;
  try {
    await UsuarioService.revogarAcesso(id);
    await carregarAcessosUsuariosCrud();
  } catch (err) { alert(err.message); }
}

watch(() => formCaixa.empresa_id, () => { formCaixa.filial_id = ''; });

async function carregarCaixasPdvCrud() {
  try { listaCaixasPdv.value = await CaixaService.listarCaixas(); } catch (err) { console.error(err); }
}
function abrirModalNovoCaixa() { formCaixa.nome = ''; formCaixa.empresa_id = ''; formCaixa.filial_id = ''; mostrarModalCaixa.value = true; }

async function salvarCaixaPdv() {
  try {
    const dados = await CaixaService.cadastrarCaixa(formCaixa);
    alert(dados.mensagem);
    mostrarModalCaixa.value = false;
    await carregarCaixasPdvCrud();
  } catch (err) { alert(err.message); }
}

async function alternarStatusCaixa(id, valor) {
  try {
    await CaixaService.alternarStatus(id, valor);
    await carregarCaixasPdvCrud();
  } catch (err) { console.error(err); }
}

async function selecionarTurnoParaExtrato(turno) {
  console.log("Card clicado! Dados do turno recebidos:", turno);
  
  if (turnoSelecionadoAcompanhamento.value?.movimento_id === turno.movimento_id) {
    turnoSelecionadoAcompanhamento.value = null;
    extratoVendasTurnoAcompanhamento.value = [];
    return;
  }

  turnoSelecionadoAcompanhamento.value = turno;
  extratoVendasTurnoAcompanhamento.value = []; 

  const converterParaHorarioLocalEstrito = (dataOrigem) => {
    if (!dataOrigem || String(dataOrigem) === 'null' || String(dataOrigem) === 'undefined' || dataOrigem === '') {
      return '';
    }
    try {
      const d = new Date(dataOrigem);
      if (isNaN(d.getTime())) {
        return String(dataOrigem).includes('T') 
          ? String(dataOrigem).replace('T', ' ').replace('Z', '').split('.')[0] 
          : String(dataOrigem);
      }
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      const hora = String(d.getHours()).padStart(2, '0');
      const minuto = String(d.getMinutes()).padStart(2, '0');
      const segundo = String(d.getSeconds()).padStart(2, '0');

      return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
    } catch (e) {
      console.error("Falha ao formatar data, usando string bruta:", dataOrigem);
      return String(dataOrigem);
    }
  };

  const idDoCaixa = turno.caixa_id || turno.id;
  const paramAbertura = converterParaHorarioLocalEstrito(turno.data_abertura);
  const paramFechamento = turno.status === 'A' ? '' : converterParaHorarioLocalEstrito(turno.data_fechamento);

  console.log(`Buscando extrato para Caixa: ${idDoCaixa} | Abertura: ${paramAbertura} | Fechamento: ${paramFechamento}`);

  try {
    const resposta = await CaixaService.obterExtratoTurno(idDoCaixa, paramAbertura, paramFechamento);
    console.log("Resposta bruta da API de Extrato:", resposta);
    
    if (resposta && resposta.dados) {
      extratoVendasTurnoAcompanhamento.value = resposta.dados;
    } else if (resposta && resposta.data && resposta.data.dados) {
      extratoVendasTurnoAcompanhamento.value = resposta.data.dados;
    } else if (Array.isArray(resposta)) {
      extratoVendasTurnoAcompanhamento.value = resposta;
    } else if (resposta && Array.isArray(resposta.data)) {
      extratoVendasTurnoAcompanhamento.value = resposta.data;
    } else {
      extratoVendasTurnoAcompanhamento.value = [];
    }

    console.log("Array reativo final preenchido para o template:", extratoVendasTurnoAcompanhamento.value);
  } catch (err) {
    console.error('Erro ao buscar lançamentos do turno:', err);
  }
}

async function carregarAcompanhamentoCaixas() {
  if (!empresaAtivaId.value || !filialAtivaId.value) return;
  try {
    listaMonitoramentoCaixas.value = await CaixaService.carregarAcompanhamento(filtroDataAcompanhamento.value);
  } catch (err) { console.error('Falha ao sincronizar monitor de caixas:', err); }
}

async function carregarDicionarioEscopos() {
  try { listaEscopoTabelas.value = await ConfigService.listarEscoposTabelas(); } catch (err) { console.error('Falha ao carregar:', err); }
}

async function alterarEscopoTabela(tabelaNome, novoEscopo) {
  try { await ConfigService.alterarEscopoTabela(tabelaNome, novoEscopo); } catch (err) { console.error(err); await carregarDicionarioEscopos(); }
}

const parcelasFiltradasPorBandeira = computed(() => {
  if (!bandeiraSelecionadaFiltro.value) return dadosRecebiveis.value.extratoParcelas;
  return dadosRecebiveis.value.extratoParcelas.filter(p => p.bandeira === bandeiraSelecionadaFiltro.value);
});

function alternarFiltroBandeira(bandeira) {
  bandeiraSelecionadaFiltro.value = (bandeiraSelecionadaFiltro.value === bandeira) ? '' : bandeira;
}

async function carregarRelatorioRecebiveis() {
  if (!empresaAtivaId.value || !filialAtivaId.value) return;
  try {
    dadosRecebiveis.value = await ConfigService.carregarRelatorioRecebiveis(filtroCcDataInicio.value, filtroCcDataFim.value);
    bandeiraSelecionadaFiltro.value = ''; 
  } catch (err) { console.error('Erro ao mapear relatório financeiro:', err); }
}

function resetarFormCliente() {
  editandoClienteId.value = null;
  formCliente.value = {
    nome: '', cpf: '', rg: '', data_nascimento: '', telefone: '', email: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    limite_credito: 0, bloqueado: 'N', motivo_bloqueio: ''
  };
}

async function carregarClientes() {
  if (!empresaAtivaId.value) return;
  try { listaClientes.value = await ClienteService.listar(filtroBuscaCliente.value); } catch (err) { console.error(err); }
}

async function salvarCliente() {
  if (!formCliente.value.nome) return alert('O nome do cliente é obrigatório.');
  try {
    await ClienteService.salvar(formCliente.value, editandoClienteId.value);
    exibindoModalCliente.value = false;
    resetarFormCliente();
    await carregarClientes();
  } catch (err) { alert(err.message); }
}

function iniciarEdicaoCliente(cliente) {
  editandoClienteId.value = cliente.id;
  formCliente.value = { ...cliente };
  if (cliente.data_nascimento) formCliente.value.data_nascimento = cliente.data_nascimento.split('T')[0];
  exibindoModalCliente.value = true;
}

async function excluirCliente(id) {
  if (!confirm('Tem certeza de que deseja remover este cliente?')) return;
  try { await ClienteService.excluir(id); await carregarClientes(); } catch (err) { console.error(err); }
}

async function buscarCep() {
  try {
    const data = await ClienteService.consultarCep(formCliente.value.cep);
    if (data) {
      formCliente.value.logradouro = data.logradouro;
      formCliente.value.bairro = data.bairro;
      formCliente.value.cidade = data.localidade;
      formCliente.value.estado = data.uf;
    }
  } catch (err) { console.error(err); }
}
// Dicionário de caminhos (paths) dos ícones em SVG
const iconesMenu = {
  HomeIcon: `<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />`,
  
  UsersIcon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />`,
  
  CreditCardIcon: `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />`,
  
  ChartBarIcon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />`,
  
  AdjustmentsIcon: `<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12h7.5" />`,
  
  // Ícone Padrão
  DefaultIcon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />`
};

// 🌟 🔄 CENTRALIZAÇÃO LIMPA E ÚNICA DE WATCHERS FILTRADOS POR MÓDULOS (LIVRE DE DUPLICIDADES E ERROS DE ESCOPO)
watch([empresaAtivaId, filialAtivaId, abaAtiva, filtroDataAcompanhamento], () => {
  if (abaAtiva.value === '/acompanhamento-caixas') carregarAcompanhamentoCaixas();
});

watch([empresaAtivaId, filialAtivaId, abaAtiva, filtroCcDataInicio, filtroCcDataFim], () => {
  if (abaAtiva.value === '/recebiveis-cc') carregarRelatorioRecebiveis();
});

watch([abaAtiva, empresaAtivaId, filialAtivaId, filtroBuscaCliente], () => { 
  if (abaAtiva.value === '/clientes') carregarClientes(); 
});

watch(abaAtiva, (novaAba) => { 
  if (novaAba === '/configuracoes-escopo') carregarDicionarioEscopos(); 
});

watch([abaAtiva, empresaAtivaId, filialAtivaId], () => { 
  turnoSelecionadoAcompanhamento.value = null; 
  extratoVendasTurnoAcompanhamento.value = []; 
});
</script>