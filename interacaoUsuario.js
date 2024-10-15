import { formatarTaxaDI, formatarMoeda, formatarData } from './formatacao.js';
import { obterTaxaPoupanca, obterTaxaDI } from './api.js';
import { calcularRendimentoPoupanca } from './calculoPoupanca.js';
import { calcularRendimentoCDB, calcularAliquotaIR, calcularIOF } from './calculoCDBRDB.js';
import { calcularRendimentoLCX } from './calculoLCX.js';

// Cache para armazenar taxas e resultados
let cacheTaxaDI = null;
let cacheTaxaPoupanca = null;

// Função debounce para limitar a frequência das atualizações
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Função para atualizar a taxa DI no campo de entrada
async function atualizarTaxaDI() {
    if (cacheTaxaDI === null) {
        try {
            cacheTaxaDI = await obterTaxaDI();
        } catch (error) {
            console.error("Erro ao obter a taxa DI:", error);
            cacheTaxaDI = 'Não disponível';
        }
    }
    document.getElementById("taxaDI").value = formatarTaxaDI(cacheTaxaDI);
}

// Função para atualizar o elemento com a data atual
function atualizarDataAtual() {
    const elementoData = document.getElementById('dataAtual');
    const dataFormatada = formatarData(new Date());
    elementoData.setAttribute('data-value', dataFormatada);
    elementoData.textContent = dataFormatada;
}

// Função para formatar valores como moeda com "R$"
function formatarValorComoMoeda(valor) {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Função para extrair valor numérico de um campo formatado
function extrairValorNumerico(valor) {
    return parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'));
}

// Função para formatar o valor do campo de entrada
function formatarEntrada(valor) {
    const valorLimpo = valor.replace(/\D/g, '');
    const valorFormatado = valorLimpo.replace(/(\d)(\d{2})$/, '$1,$2')
                                      .replace(/(\d)(\d{3}),(\d{2})$/, '$1.$2,$3')
                                      .replace(/(\d)(\d{3})\.(\d{3}),(\d{2})$/, '$1.$2.$3,$4');
    return `R$ ${valorFormatado}`;
}

// Função para atualizar o campo com formatação ao digitar
function atualizarFormatoCampo(event) {
    const input = event.target;
    const valorFormatado = formatarEntrada(input.value);
    input.value = valorFormatado;
}

// Função para converter unidades de tempo para dias
function converterParaDias(tempo, unidade) {
    switch (unidade) {
        case 'dias':
            return tempo;
        case 'meses':
            return Math.round(tempo * 30.41);
        case 'anos':
            return Math.round(tempo * 365);
        default:
            throw new Error('Unidade de tempo desconhecida');
    }
}

// Função para obter todas as taxas
async function obterTaxas() {
    try {
        const [taxaDI, taxaPoupanca] = await Promise.all([obterTaxaDI(), obterTaxaPoupanca()]);
        return { taxaDI, taxaPoupanca };
    } catch (error) {
        console.error("Erro ao obter taxas:", error);
        return { taxaDI: null, taxaPoupanca: null };
    }
}

// Função para habilitar/desabilitar campo de aporte mensal
function verificarAporteMensal(dias) {
    const aporteField = document.getElementById("aporteMensal");
    if (dias < 30) {
        aporteField.disabled = true;
        aporteField.value = ''; // Limpar o valor se desabilitar
    } else {
        aporteField.disabled = false;
    }
}

// Função para atualizar os resultados
async function atualizarResultados() {
    const valorInvestido = extrairValorNumerico(document.getElementById("valorInvestido").value);
    const tempo = parseInt(document.getElementById("tempo").value);
    const unidade = document.getElementById("unidadeTempo").value;

    // Calcule dias corretamente para qualquer unidade
    const dias = converterParaDias(tempo, unidade);
    verificarAporteMensal(dias); // Verifica se deve habilitar ou desabilitar o aporte mensal
    const aporteMensal = extrairValorNumerico(document.getElementById("aporteMensal").value) || 0;

    if (isNaN(valorInvestido) || valorInvestido <= 0 || isNaN(tempo) || tempo <= 0) {
        return;
    }

    // Obtém taxas e resultados em paralelo
    const { taxaDI, taxaPoupanca } = await obterTaxas();
    cacheTaxaDI = taxaDI;
    cacheTaxaPoupanca = taxaPoupanca;

    // Prepare todos os resultados antes de atualizar o DOM
    let resultadoPoupancaHTML = '';
    let resultadoCDBRDBHTML = '';
    let resultadoLCILCAHTML = '';

    // Atualiza o resultado da poupança
    if (cacheTaxaPoupanca !== null) {
        const rendimentoBrutoPoupanca = calcularRendimentoPoupanca(valorInvestido, cacheTaxaPoupanca, aporteMensal, dias);
        const totalAportesPoupanca = (tempo >= 1) ? (aporteMensal * tempo) : 0; // Aporte contabilizado pelos meses aplicados
        const rendimentoLiquidoPoupanca = valorInvestido + totalAportesPoupanca + rendimentoBrutoPoupanca;

        resultadoPoupancaHTML = 
            `<h3>Poupança</h3>
            Valor da Aplicação: ${formatarValorComoMoeda(valorInvestido)}<br>
            ${totalAportesPoupanca > 0 ? `Aportes: ${formatarValorComoMoeda(totalAportesPoupanca)}<br>` : ''}
            Rendimento Bruto: ${formatarValorComoMoeda(rendimentoBrutoPoupanca)}<br>
            Valor Líquido: ${formatarValorComoMoeda(rendimentoLiquidoPoupanca)}`;
    } else {
        resultadoPoupancaHTML = `<h3>Poupança</h3> Não foi possível obter a taxa de poupança.`;
    }

    // Atualiza o resultado do CDB/RDB
    if (taxaDI !== null) {
        const percentualDI_CDB = parseFloat(document.getElementById("percentualDI_CDB").value) || 100;
        const totalAportesCDB = (tempo >= 1) ? (aporteMensal * tempo) : 0; // Aporte contabilizado pelos meses aplicados

        const rendimentoBrutoCDB = calcularRendimentoCDB(valorInvestido, taxaDI * percentualDI_CDB / 100, dias, aporteMensal, dias);
        const ioef = calcularIOF(valorInvestido, rendimentoBrutoCDB, dias);
        const rendimentoBrutoComIOF = rendimentoBrutoCDB - ioef;
        const aliquotaIR = calcularAliquotaIR(dias);
        const ir = rendimentoBrutoComIOF * (aliquotaIR / 100);
        const rendimentoLiquidoCDB = valorInvestido + totalAportesCDB + rendimentoBrutoComIOF - ir;

        // Remove classes antigas
        const irIcon = document.querySelector(".ir-icon");
        if (irIcon) {
            irIcon.classList.remove("ir-22-5", "ir-20", "ir-17-5", "ir-15");
        }

        // Adiciona a classe correta com base na alíquota IR
        const irClass = `ir-${aliquotaIR.toString().replace('.', '-')}`;

        resultadoCDBRDBHTML = 
            `<h3>CDB/RDB</h3>
            Valor da Aplicação: ${formatarValorComoMoeda(valorInvestido)}<br>
            ${totalAportesCDB > 0 ? `Aportes: ${formatarValorComoMoeda(totalAportesCDB)}<br>` : ''}
            ${ioef > 0 ? `IOF: ${formatarValorComoMoeda(ioef)}<br>` : ''}
            Rendimento Bruto: ${formatarValorComoMoeda(rendimentoBrutoCDB)}<br>
            Imposto de Renda: ${formatarValorComoMoeda(ir)} <span class="ir-icon ${irClass}"><span id="aliquotaIR">${aliquotaIR}%</span></span><br> 
            Valor Líquido: ${formatarValorComoMoeda(rendimentoLiquidoCDB)}`;
    } else {
        resultadoCDBRDBHTML = `<h3>CDB/RDB</h3> Não foi possível obter a taxa DI.`;
    }

    // Atualiza o resultado do LCI/LCA
    if (cacheTaxaDI !== null) {
        const rendimentoBrutoLCI = calcularRendimentoLCX(valorInvestido, cacheTaxaDI, dias);
        const rendimentoLiquidoLCI = valorInvestido + rendimentoBrutoLCI; // Sem aporte mensal

        resultadoLCILCAHTML = 
            `<h3>LCI/LCA</h3>
            Valor da Aplicação: ${formatarValorComoMoeda(valorInvestido)}<br>
            Rendimento Bruto: ${formatarValorComoMoeda(rendimentoBrutoLCI)}<br>
            Valor Líquido: ${formatarValorComoMoeda(rendimentoLiquidoLCI)}`;
    } else {
        resultadoLCILCAHTML = `<h3>LCI/LCA</h3> Não foi possível obter a taxa de LCI/LCA.`;
    }

    // Atualize o DOM com os resultados consolidados
    document.getElementById("resultadoPoupanca").innerHTML = resultadoPoupancaHTML;
    document.getElementById("resultadoCDB-RDB").innerHTML = resultadoCDBRDBHTML;
    document.getElementById("resultadoLCI-LCA").innerHTML = resultadoLCILCAHTML;
}

// Adiciona ouvintes de eventos
const inputs = document.querySelectorAll("#valorInvestido, #tempo, #unidadeTempo, #percentualDI_CDB, #taxaDI, #aporteMensal");
const atualizarResultadosDebounced = debounce(atualizarResultados, 300);
inputs.forEach(input => input.addEventListener("input", atualizarResultadosDebounced));

// Adiciona evento de formatação ao campo de valor investido
document.getElementById("valorInvestido").addEventListener("input", atualizarFormatoCampo);

// Adiciona evento de formatação ao campo de aporte mensal
document.getElementById("aporteMensal").addEventListener("input", atualizarFormatoCampo);

// Chama a função ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    atualizarDataAtual();
    atualizarTaxaDI(); // Atualiza a Taxa DI ao carregar a página
});
