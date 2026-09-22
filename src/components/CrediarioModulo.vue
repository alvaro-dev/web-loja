<template>
  <div class="space-y-6 text-left animate-fade-in">
    
    <!-- HEADER DA TELA E BUSCA -->
    <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-800/90 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
      <div class="space-y-1">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-indigo-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5M5.25 7.5h13.5m-12 3h10.5m-12 3h13.5m-12 3h10.5M4.5 20.25h15" />
          </svg>
          Ficha de Crediário Próprio
        </h3>
        <p class="text-xs text-slate-400">Consulte pendências, confira limites e realize recebimentos integrados à retaguarda financeira.</p>
      </div>

      <!-- Barra de pesquisa rápida -->
      <div class="w-full xl:w-auto flex items-center gap-3">
        <div class="relative w-full xl:w-80">
          <input 
            type="text" 
            v-model="filtroBusca"
            @keyup.enter="buscarClienteCrediario"
            placeholder="Digite o Nome ou CPF do cliente..." 
            class="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-4 pr-10 py-3 text-sm outline-none w-full focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            :disabled="carregandoFicha"
          />
          <button 
            v-if="filtroBusca"
            @click="filtroBusca = ''; limparEstado();"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            ✕
          </button>
        </div>
        <button 
          @click="buscarClienteCrediario"
          :disabled="carregandoFicha"
          class="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-indigo-600/20 shrink-0 flex items-center gap-2 h-11.5"
        >
          <span v-if="!carregandoFicha">Buscar</span>
          <span v-else class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
        </button>
      </div>
    </div>

    <!-- NOTIFICAÇÕES -->
    <div v-if="mensagemErro" class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-medium flex items-center gap-2">
      <span class="text-lg">⚠️</span> {{ mensagemErro }}
    </div>
    <div v-if="mensagemSucesso" class="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl font-medium flex items-center gap-2">
      <span class="text-lg">✅</span> {{ mensagemSucesso }}
    </div>

    <!-- ESTADO INICIAL / VAZIO -->
    <div v-if="!clienteAtivo && !carregandoFicha" class="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-16 text-center text-slate-500 italic space-y-3">
      <div class="text-4xl">🔍</div>
      <p class="text-slate-400 font-medium not-italic">Nenhuma ficha ativa</p>
      <p class="text-xs text-slate-500">Utilize o campo de busca acima informando o nome ou CPF do cliente para carregar a conta.</p>
    </div>

    <!-- TELA DE SKELETON / LOADING -->
    <div v-if="carregandoFicha" class="space-y-6 animate-pulse">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="h-28 bg-slate-800/40 rounded-2xl border border-slate-700/40"></div>
      </div>
      <div class="h-64 bg-slate-800/30 rounded-2xl border border-slate-700/40"></div>
    </div>

    <!-- CONTEÚDO PRINCIPAL (FICHA DO CLIENTE) -->
    <div v-if="clienteAtivo && !carregandoFicha" class="space-y-6">
      
      <!-- PAINEL CARD FINANCEIRO (KPIs) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Limite -->
        <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-2 shadow-md border-l-4 border-l-indigo-500 relative overflow-hidden group">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Limite de Crédito Total</span>
          <p class="text-2xl font-black text-white font-mono">
            R$ {{ formatarMoeda(clienteAtivo?.limite_credito) }}
          </p>
          <span class="text-[10px] text-slate-500 block">Homologado no cadastro do cliente</span>
        </div>

        <!-- Débito -->
        <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-2 shadow-md border-l-4 border-l-rose-500 relative overflow-hidden">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total de Débitos Pendentes</span>
          <p class="text-2xl font-black text-rose-400 font-mono">
            R$ {{ formatarMoeda(totalDevedor) }}
          </p>
          <span class="text-[10px] text-slate-500 block">Soma de parcelas em aberto e parciais</span>
        </div>

        <!-- Saldo Disponível -->
        <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-2 shadow-md border-l-4" 
             :class="creditoDisponivel < 0 ? 'border-l-rose-500' : 'border-l-emerald-500'">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Crédito Disponível</span>
          <p class="text-2xl font-black font-mono" :class="creditoDisponivel < 0 ? 'text-rose-400' : 'text-emerald-400'">
            R$ {{ formatarMoeda(creditoDisponivel) }}
          </p>
          <span class="text-[10px] block" :class="creditoDisponivel < 0 ? 'text-rose-500' : 'text-slate-500'">
            {{ creditoDisponivel < 0 ? 'Limite de crédito estourado' : 'Disponível para novas vendas' }}
          </span>
        </div>
      </div>

      <!-- LISTAGEM DE TÍTULOS -->
      <div class="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
        <div class="p-5 bg-slate-900/50 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div class="text-left">
            <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Extrato de Ficha</span>
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              {{ clienteAtivo?.nome }}
              <span class="text-xs bg-slate-800 border border-slate-700 font-mono text-slate-400 px-2.5 py-0.5 rounded-full">
                CPF: {{ formatarCPF(clienteAtivo?.cpf) }}
              </span>
            </h4>
          </div>
          
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button 
              @click="selecionarTodasAsParcelas"
              class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              {{ parcelasSelecionadasIds.length === parcelasPendentes.length ? 'Desmarcar Todos' : 'Selecionar Todos' }}
            </button>
            <span class="text-xs bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg font-bold text-indigo-300 shrink-0">
              {{ parcelasPendentes.length }} Título(s)
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-900/30 border-b border-slate-700 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                <th class="p-4 text-center w-14">Pago?</th>
                <th class="p-4">Vencimento</th>
                <th class="p-4">Cupom / Origem</th>
                <th class="p-4 text-center">Parcela</th>
                <th class="p-4 text-center">Status / Atraso</th>
                <th class="p-4 text-right">Valor Inicial</th>
                <th class="p-4 text-right">Saldo Devedor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/40 text-slate-200">
              <tr v-if="parcelasPendentes.length === 0" class="text-center text-slate-500">
                <td colspan="7" class="py-16 text-center space-y-2">
                  <div class="text-3xl">🎉</div>
                  <p class="text-emerald-400 font-bold font-sans">Sem débitos pendentes!</p>
                  <p class="text-xs text-slate-500">Este cliente está com as contas totalmente liquidadas.</p>
                </td>
              </tr>
              <tr 
                v-for="p in parcelasPendentes" 
                :key="p.id" 
                class="hover:bg-slate-700/15 transition-all cursor-pointer group"
                :class="parcelasSelecionadasIds.includes(p.id) ? 'bg-indigo-500/5' : ''"
                @click="alternarSelecaoParcela(p)"
              >
                <!-- Checkbox -->
                <td class="p-4 text-center" @click.stop>
                  <input 
                    type="checkbox" 
                    :value="p.id" 
                    v-model="parcelasSelecionadasIds"
                    class="w-4.5 h-4.5 rounded-md text-indigo-600 bg-slate-900 border-slate-700 focus:ring-offset-slate-900 accent-indigo-500 cursor-pointer transition-all"
                  />
                </td>
                
                <!-- Vencimento -->
                <td class="p-4 font-mono font-medium" :class="obterDiasAtraso(p.data_vencimento) > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'">
                  {{ formatarData(p.data_vencimento) }}
                </td>
                
                <!-- Origem/Venda -->
                <td class="p-4 font-mono text-xs text-slate-400">
                  <span v-if="p.venda_id" class="hover:underline" title="ID da Venda Completo">
                    Venda #{{ String(p.venda_id).substring(0, 8) }}
                  </span>
                  <span v-else class="text-slate-500 italic">Lançamento Avulso</span>
                </td>
                
                <!-- Parcela -->
                <td class="p-4 text-center font-mono text-xs">
                  <span class="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-semibold">
                    {{ p.numero_parcela || 1 }} de {{ p.total_parcelas || 1 }}
                  </span>
                </td>
                
                <!-- Status / Atraso -->
                <td class="p-4 text-center">
                  <span 
                    v-if="obterDiasAtraso(p.data_vencimento) > 0" 
                    class="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  >
                    {{ obterDiasAtraso(p.data_vencimento) }} dias atraso
                  </span>
                  <span v-else class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    No prazo
                  </span>
                </td>
                
                <!-- Valor Original -->
                <td class="p-4 text-right font-mono text-slate-400">
                  R$ {{ formatarMoeda(p.valor_original) }}
                </td>
                
                <!-- Saldo Devedor -->
                <td class="p-4 text-right font-mono font-bold text-indigo-300">
                  R$ {{ formatarMoeda(p.valor_saldo) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PAINEL DE RECEBIMENTO (BAIXA ATIVA) -->
      <transition name="slide-up">
        <div v-if="parcelasSelecionadasIds.length > 0" class="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-2xl animate-fade-in relative overflow-hidden">
          
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Baixa Registrada Ativa</span>
            <p class="text-sm text-slate-300">
              Você marcou <span class="text-white font-bold font-mono">{{ parcelasSelecionadasIds.length }}</span> parcela(s) deste cliente.
            </p>
            <p class="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              Total a Pagar: R$ {{ formatarMoeda(totalSelecionado) }}
            </p>
          </div>

          <div class="w-full lg:w-auto flex flex-col sm:flex-row gap-4 items-end">
            <!-- Método de Pagamento -->
            <div class="flex flex-col text-left w-full sm:w-56">
              <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Meio de Recebimento</label>
              <select 
                v-model="formaPagamento" 
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
              >
                <option value="DN">💵 Dinheiro (Registrar Caixa)</option>
                <option value="PX">⚡ Pix (Transferência Digital)</option>
                <option value="CD">💳 Cartão de Débito</option>
              </select>
            </div>

            <!-- Botão Confirmar -->
            <button 
              @click="processarRecebimentoCrediario"
              :disabled="processandoBaixa"
              class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white font-bold py-2.5 px-8 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer h-11.5"
            >
              <svg v-if="processandoBaixa" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ processandoBaixa ? 'Efetivando Baixa...' : 'Confirmar Recebimento' }}</span>
            </button>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CrediarioService from '@/services/CrediarioService';

// ESTADOS DO COMPONENTE
const filtroBusca = ref('');
const mensagemErro = ref('');
const mensagemSucesso = ref('');
const carregandoFicha = ref(false);
const processandoBaixa = ref(false);

const clienteAtivo = ref(null); 
const parcelasPendentes = ref([]); 
const parcelasSelecionadasIds = ref([]); 
const formaPagamento = ref('DN'); 

// COMPUTADOS REATIVOS COM TRATAMENTO DE VALOR NULO
const totalDevedor = computed(() => {
  if (!parcelasPendentes.value) return 0;
  return parcelasPendentes.value.reduce((acc, curr) => {
    const valor = parseFloat(curr?.valor_saldo || curr?.saldo_restante);
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);
});

const creditoDisponivel = computed(() => {
  if (!clienteAtivo.value) return 0;
  const limite = parseFloat(clienteAtivo.value.limite_credito);
  const limiteLimpo = isNaN(limite) ? 0 : limite;
  return limiteLimpo - totalDevedor.value;
});

const totalSelecionado = computed(() => {
  if (!parcelasPendentes.value) return 0;
  return parcelasPendentes.value
    .filter(p => p && p.id && parcelasSelecionadasIds.value.includes(p.id))
    .reduce((acc, curr) => {
      const valor = parseFloat(curr?.valor_saldo || curr?.saldo_restante);
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
});

// AÇÕES DA INTERFACE
function alternarSelecaoParcela(parcela) {
  if (!parcela || !parcela.id) return;
  const index = parcelasSelecionadasIds.value.indexOf(parcela.id);
  if (index > -1) {
    parcelasSelecionadasIds.value.splice(index, 1);
  } else {
    parcelasSelecionadasIds.value.push(parcela.id);
  }
}

function selecionarTodasAsParcelas() {
  if (parcelasSelecionadasIds.value.length === parcelasPendentes.value.length) {
    parcelasSelecionadasIds.value = [];
  } else {
    parcelasSelecionadasIds.value = parcelasPendentes.value.map(p => p.id);
  }
}

function limparEstado() {
  clienteAtivo.value = null;
  parcelasPendentes.value = [];
  parcelasSelecionadasIds.value = [];
  mensagemErro.value = '';
  mensagemSucesso.value = '';
}

// FORMATADORES E CALCULADORES AUXILIARES
function formatarMoeda(valor) {
  const v = parseFloat(valor);
  if (isNaN(v)) return '0,00';
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarData(dataRaw) {
  if (!dataRaw) return 'S/D';
  const data = new Date(dataRaw);
  // Corrige fuso horário do renderizador de data do navegador local
  return new Date(data.getTime() + data.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
}

function formatarCPF(cpfRaw) {
  if (!cpfRaw) return 'N/I';
  const clean = cpfRaw.replace(/\D/g, '');
  if (clean.length !== 11) return cpfRaw;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function obterDiasAtraso(dataVencimentoRaw) {
  if (!dataVencimentoRaw) return 0;
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const venc = new Date(dataVencimentoRaw);
  const vencLocal = new Date(venc.getTime() + venc.getTimezoneOffset() * 60000);
  vencLocal.setHours(0,0,0,0);
  
  const diferencaTempo = hoje - vencLocal;
  const diferencaDias = Math.floor(diferencaTempo / (1000 * 60 * 60 * 24));
  return diferencaDias > 0 ? diferencaDias : 0;
}

// INTEGRAÇÕES COM O SERVIÇO
async function buscarClienteCrediario() {
  mensagemErro.value = '';
  mensagemSucesso.value = '';
  parcelasSelecionadasIds.value = [];
  
  if (!filtroBusca.value.trim()) {
    mensagemErro.value = 'Por favor, informe o nome ou CPF do cliente para realizar a consulta.';
    return;
  }

  carregandoFicha.value = true;

  try {
    const resposta = await CrediarioService.buscarExtrato(filtroBusca.value);
    const dados = resposta?.data || resposta;

    if (dados && dados.cliente) {
      clienteAtivo.value = dados.cliente;
      parcelasPendentes.value = dados.parcelas || [];
    } else {
      clienteAtivo.value = null;
      parcelasPendentes.value = [];
      mensagemErro.value = 'Nenhum cliente localizado ou o crediário não está ativo.';
    }
  } catch (error) {
    clienteAtivo.value = null;
    parcelasPendentes.value = [];
    mensagemErro.value = error.message || 'Erro de comunicação ao buscar extrato.';
  } finally {
    carregandoFicha.value = false;
  }
}

async function processarRecebimentoCrediario() {
  if (parcelasSelecionadasIds.value.length === 0) return;
  
  const totalConfirmado = totalSelecionado.value;
  if (!confirm(`Confirmar recebimento de R$ ${formatarMoeda(totalConfirmado)} via ${formaPagamento.value === 'DN' ? 'Dinheiro' : formaPagamento.value === 'PX' ? 'Pix' : 'Cartão de Débito'}?`)) {
    return;
  }

  processandoBaixa.value = true;
  mensagemErro.value = '';
  mensagemSucesso.value = '';

  const payload = {
    clienteId: clienteAtivo.value?.id,
    parcelasIds: parcelasSelecionadasIds.value,
    formaPagamento: formaPagamento.value
  };

  try {
    const resposta = await CrediarioService.processarBaixaTulos(payload);
    const dados = resposta?.data || resposta;
    
    mensagemSucesso.value = dados.mensagem || 'Recebimento homologado com sucesso!';
    
    // Filtra para remover da tela as que acabam de ser pagas
    parcelasPendentes.value = parcelasPendentes.value.filter(p => p && !parcelasSelecionadasIds.value.includes(p.id));
    parcelasSelecionadasIds.value = [];
    
    if (dados.clienteAtualizado) {
      clienteAtivo.value = dados.clienteAtualizado;
    }
  } catch (error) {
    mensagemErro.value = error.message || 'Falha ao processar baixa financeira.';
  } finally {
    processandoBaixa.value = false;
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>