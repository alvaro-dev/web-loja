<template>
  <div class="space-y-6 animate-fade-in text-left">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50">
      <div>
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-indigo-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5M5.25 7.5h13.5m-12 3h10.5m-12 3h13.5m-12 3h10.5M4.5 20.25h15" />
          </svg>
          Gestão de Crediário Próprio
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">Consulte títulos pendentes, histórico de débitos e realize recebimentos integrados ao caixa.</p>
      </div>

      <div class="w-full sm:w-auto flex items-center gap-3">
        <input 
          type="text" 
          v-model="filtroBusca"
          @keyup.enter="buscarClienteCrediario"
          placeholder="Digitar Nome ou CPF do cliente..." 
          class="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full sm:w-72 focus:border-indigo-500 transition-colors"
        />
        <button 
          @click="buscarClienteCrediario"
          class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-lg shrink-0"
        >
          Buscar
        </button>
      </div>
    </div>

    <div v-if="mensagemErro" class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{{ mensagemErro }}</div>
    <div v-if="mensagemSucesso" class="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl">{{ mensagemSucesso }}</div>

    <div v-if="!clienteAtivo" class="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-500 italic">
      Utilize o campo de busca acima para carregar a ficha de crediário de um cliente.
    </div>

    <div v-else class="space-y-6">
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-2 shadow-lg border-l-4 border-l-indigo-500">
          <span class="text-xs font-semibold text-slate-400 uppercase">Limite de Crédito Homologado</span>
          <p class="text-2xl font-black text-white font-mono">R$ {{ Number(clienteAtivo.limite_credito).toFixed(2) }}</p>
        </div>

        <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-2 shadow-lg border-l-4 border-l-rose-500">
          <span class="text-xs font-semibold text-slate-400 uppercase">Total de Débitos Pendentes</span>
          <p class="text-2xl font-black text-rose-400 font-mono">R$ {{ Number(totalDevedor).toFixed(2) }}</p>
        </div>

        <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-2 shadow-lg border-l-4 border-l-emerald-500">
          <span class="text-xs font-semibold text-slate-400 uppercase">Saldo Disponível para Compras</span>
          <p class="text-2xl font-black text-emerald-400 font-mono">R$ {{ Number(creditoDisponivel).toFixed(2) }}</p>
        </div>
      </div>

      <div class="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div class="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
          <h4 class="text-sm font-bold text-slate-200 uppercase tracking-wide">Títulos e Parcelas Aguardando Recebimento</h4>
          <span class="text-xs bg-slate-800 px-3 py-1 rounded-full font-semibold text-slate-400">
            {{ parcelasPendentes.length }} títulos encontrados
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-900/30 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="p-4 text-center w-12">Selec.</th>
                <th class="p-4">Vencimento</th>
                <th class="p-4">Cupom / Origem</th>
                <th class="p-4 text-center">Parcela</th>
                <th class="p-4 text-center">Dias Atraso</th>
                <th class="p-4 text-right">Valor Original</th>
                <th class="p-4 text-right">A pagar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/40 text-slate-200">
              <tr v-if="parcelasPendentes.length === 0" class="text-center text-slate-500">
                <td colspan="7" class="py-10 italic">Este cliente não possui nenhuma parcela em aberto no crediário. Ficha limpa!</td>
              </tr>
              <tr 
                v-for="p in parcelasPendentes" 
                :key="p.id" 
                class="hover:bg-slate-700/20 transition-colors cursor-pointer"
                @click="alternarSelecaoParcela(p)"
              >
                <td class="p-4 text-center" @click.stop>
                  <input 
                    type="checkbox" 
                    :value="p.id" 
                    v-model="parcelasSelecionadasIds"
                    class="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 accent-indigo-500 cursor-pointer"
                  />
                </td>
                <td class="p-4 font-mono font-medium" :class="p.dias_atraso > 0 ? 'text-rose-400' : 'text-slate-300'">
                  {{ new Date(p.data_vencimento).toLocaleDateString() }}
                </td>
                <td class="p-4 font-mono text-xs text-slate-400">Venda #{{ p.venda_id.substring(0,8) }}...</td>
                <td class="p-4 text-center font-mono">{{ p.numero_parcela }} / {{ p.total_parcelas }}</td>
                <td class="p-4 text-center">
                  <span 
                    v-if="p.dias_atraso > 0" 
                    class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-xs font-bold"
                  >
                    {{ p.dias_atraso }} dias
                  </span>
                  <span v-else class="text-emerald-400 text-xs font-medium">No prazo</span>
                </td>
                <td class="p-4 text-right font-mono text-slate-400">R$ {{ Number(p.valor_original).toFixed(2) }}</td>
                <td class="p-4 text-right font-mono font-bold text-indigo-300">R$ {{ Number(p.valor_saldo).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="parcelasSelecionadasIds.length > 0" class="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-2xl">
        <div class="space-y-1">
          <p class="text-xs uppercase font-bold tracking-wider text-slate-400">Resumo da Baixa Ativa</p>
          <p class="text-sm text-slate-300">
            Você selecionou <span class="text-white font-bold font-mono">{{ parcelasSelecionadasIds.length }}</span> parcela(s).
          </p>
          <p class="text-2xl font-black text-emerald-400 font-mono">
            Total a Receber: R$ {{ Number(totalSelecionado).toFixed(2) }}
          </p>
        </div>

        <div class="ws-full lg:w-auto flex flex-col sm:flex-row gap-4 items-end w-full">
          <div class="flex flex-col text-left w-full sm:w-48">
            <label class="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Meio de Recebimento</label>
            <select 
              v-model="formaPagamento" 
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="DN">💵 Dinheiro (Gaveta)</option>
              <option value="PX">⚡ Pix (Conta Digital)</option>
              <option value="CD">💳 Cartão de Débito</option>
            </select>
          </div>

          <button 
            @click="processarRecebimentoCrediario"
            :disabled="processandoBaixa"
            class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer h-10"
          >
            <svg v-if="processandoBaixa" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ processandoBaixa ? 'Efetivando Baixa...' : 'Confirmar Recebimento' }}</span>
          </button>
        </div>
      </div>

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
const processandoBaixa = ref(false);

const clienteAtivo = ref(null); // Armazenará { id, nome, limite_credito, ... }
const parcelasPendentes = ref([]); // Lista de títulos vindos do banco
const parcelasSelecionadasIds = ref([]); // IDs das linhas checadas
const formaPagamento = ref('DN'); // Padrão: Dinheiro

// COMPUTADOS REATIVOS
const totalDevedor = computed(() => {
  return parcelasPendentes.value.reduce((acc, curr) => acc + parseFloat(curr.valor_saldo), 0);
});

const creditoDisponivel = computed(() => {
  if (!clienteAtivo.value) return 0;
  return parseFloat(clienteAtivo.value.limite_credito) - totalDevedor.value;
});

const totalSelecionado = computed(() => {
  return parcelasPendentes.value
    .filter(p => parcelasSelecionadasIds.value.includes(p.id))
    .reduce((acc, curr) => acc + parseFloat(curr.valor_saldo), 0);
});

// AÇÕES DA INTERFACE
function alternarSelecaoParcela(parcela) {
  const index = parcelasSelecionadasIds.value.indexOf(parcela.id);
  if (index > -1) {
    parcelasSelecionadasIds.value.splice(index, 1);
  } else {
    parcelasSelecionadasIds.value.push(parcela.id);
  }
}

// MOCK DE EVENTOS PARA TESTE DA UX (VAMOS CONECTAR AO SERVICE LOGO EM SEGUIDA)
async function buscarClienteCrediario() {
  mensagemErro.value = '';
  mensagemSucesso.value = '';
  parcelasSelecionadasIds.value = [];
  clienteAtivo.value = null;
  parcelasPendentes.value = [];

  if (!filtroBusca.value.trim()) {
    mensagemErro.value = 'Por favor, informe o nome ou CPF do cliente para realizar a consulta.';
    return;
  }

  try {
    const resposta = await CrediarioService.buscarExtrato(filtroBusca.value);
    
    // Espera receber do back-end: { sucesso: true, cliente: {...}, parcelas: [...] }
    if (resposta.cliente) {
      clienteAtivo.value = resposta.cliente;
      parcelasPendentes.value = resposta.parcelas || [];
    } else {
      mensagemErro.value = 'Nenhum cliente localizado ou o crediário não está ativo.';
    }
  } catch (error) {
    mensagemErro.value = error.message;
  }
}

async function processarRecebimentoCrediario() {
  if (parcelasSelecionadasIds.value.length === 0) return;
  
  if (!confirm(`Confirmar recebimento no valor de R$ ${totalSelecionado.value.toFixed(2)}?`)) return;

  processandoBaixa.value = true;
  mensagemErro.value = '';
  mensagemSucesso.value = '';

  const payload = {
    clienteId: clienteAtivo.value.id,
    parcelasIds: parcelasSelecionadasIds.value,
    formaPagamento: formaPagamento.value
  };

  try {
    const resposta = await CrediarioService.processarBaixaTulos(payload);
    
    mensagemSucesso.value = resposta.mensagem || 'Recebimento homologado com sucesso!';
    
    // Remove da tela as parcelas que foram pagas com sucesso
    parcelasPendentes.value = parcelasPendentes.value.filter(p => !parcelasSelecionadasIds.value.includes(p.id));
    parcelasSelecionadasIds.value = [];
    
    // Recarrega os dados do cabeçalho da ficha se o back-end mandar o objeto cliente atualizado
    if (resposta.clienteAtualizado) {
      clienteAtivo.value = resposta.clienteAtualizado;
    }
  } catch (error) {
    mensagemErro.value = error.message;
  } finally {
    processandoBaixa.value = false;
  }
}
</script>