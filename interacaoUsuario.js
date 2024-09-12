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
    return function(...args) {
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

// Função para extrair valor numérico de um campo com máscara
const extrairValorNumerico = (valor) => {
    return parseFloat(valor.replace(/[^0-9,]/g, '').replace(',', '.'));
};

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

// Função para atualizar os resultados
async function atualizarResultados() {
    const valorInvestido = extrairValorNumerico(document.getElementById("valorInvestido").value);
    const tempo = parseInt(document.getElementById("tempo").value);
    const unidade = document.getElementById("unidadeTempo").value;
    let taxaDI = parseFloat(document.getElementById("taxaDI").value.replace(',', '.')) || cacheTaxaDI;

    if (isNaN(valorInvestido) || valorInvestido <= 0 || isNaN(tempo) || tempo <= 0) {
        return;
    }

    const dias = converterParaDias(tempo, unidade);

    // Obtém taxas e resultados em paralelo
    const { taxaDI: taxaDIAtualizada, taxaPoupanca } = await obterTaxas();
    cacheTaxaDI = taxaDIAtualizada;
    cacheTaxaPoupanca = taxaPoupanca;

    // Prepare todos os resultados antes de atualizar o DOM
    let resultadoPoupancaHTML = '';
    let resultadoCDBRDBHTML = '';
    let resultadoLCILCAHTML = '';

    // Atualiza o resultado da poupança
    if (cacheTaxaPoupanca !== null) {
        const rendimentoBrutoPoupanca = calcularRendimentoPoupanca(valorInvestido, cacheTaxaPoupanca, dias);
        const rendimentoLiquidoPoupanca = valorInvestido + rendimentoBrutoPoupanca;
        resultadoPoupancaHTML = `
            <h3>Poupança</h3>
            Valor da Aplicação: ${formatarMoeda(valorInvestido)}<br>
            Rendimento Bruto: ${formatarMoeda(rendimentoBrutoPoupanca)}<br>
            Valor Líquido: ${formatarMoeda(rendimentoLiquidoPoupanca)}
        `;
    } else {
        resultadoPoupancaHTML = `<h3>Poupança</h3> Não foi possível obter a taxa de poupança.`;
    }

    // Atualiza o resultado do CDB/RDB
    if (taxaDI !== null) {
        const percentualDI_CDB = parseFloat(document.getElementById("percentualDI_CDB").value) || 100;
        const rendimentoBrutoCDB = calcularRendimentoCDB(valorInvestido, taxaDI * percentualDI_CDB / 100, dias);
        const ioef = calcularIOF(valorInvestido, rendimentoBrutoCDB, dias);
        const rendimentoBrutoComIOF = rendimentoBrutoCDB - ioef;
        const aliquotaIR = calcularAliquotaIR(dias);
        const ir = rendimentoBrutoComIOF * (aliquotaIR / 100);
        const rendimentoLiquidoCDB = valorInvestido + rendimentoBrutoComIOF - ir;

        // Remove classes antigas
        const irIcon = document.querySelector(".ir-icon");
        if (irIcon) {
            irIcon.classList.remove("ir-22-5", "ir-20", "ir-17-5", "ir-15");
        }

        // Adiciona a classe correta com base na alíquota IR
        const irClass = `ir-${aliquotaIR.toString().replace('.', '-')}`;
        
        resultadoCDBRDBHTML = `
            <h3>CDB/RDB</h3>
            Valor da Aplicação: ${formatarMoeda(valorInvestido)}<br>
            ${ioef > 0 ? `IOF: ${formatarMoeda(ioef)}<br>` : ''}
            Rendimento Bruto: ${formatarMoeda(rendimentoBrutoCDB)}<br>
            Imposto de Renda ${formatarMoeda(ir)} <span class="ir-icon ${irClass}"><span id="aliquotaIR">${aliquotaIR}%</span></span><br> 
            Valor Líquido: ${formatarMoeda(rendimentoLiquidoCDB)}
        `;
    } else {
        resultadoCDBRDBHTML = `<h3>CDB/RDB</h3> Não foi possível obter a taxa DI.`;
    }

    // Atualiza o resultado do LCI/LCA
    if (taxaDI !== null) {
        const percentualDI_LCX = parseFloat(document.getElementById("percentualDI_LCX").value) || 100;
        const rendimentoBrutoLCX = calcularRendimentoLCX(valorInvestido, taxaDI * percentualDI_LCX / 100, dias);
        const rendimentoLiquidoLCX = valorInvestido + rendimentoBrutoLCX;

        resultadoLCILCAHTML = `
            <h3>LCI/LCA</h3>
            Valor da Aplicação: ${formatarMoeda(valorInvestido)}<br>
            Rendimento Bruto: ${formatarMoeda(rendimentoBrutoLCX)}<br>
            Valor Líquido: ${formatarMoeda(rendimentoLiquidoLCX)}
        `;
    } else {
        resultadoLCILCAHTML = `<h3>LCI/LCA</h3> Não foi possível obter a taxa DI.`;
    }

    // Atualize o DOM com os resultados consolidados
    document.getElementById("resultadoPoupanca").innerHTML = resultadoPoupancaHTML;
    document.getElementById("resultadoCDB-RDB").innerHTML = resultadoCDBRDBHTML;
    document.getElementById("resultadoLCI-LCA").innerHTML = resultadoLCILCAHTML;
}

// Adiciona evento de mudança ao formulário com debouncing
const inputs = document.querySelectorAll("#valorInvestido, #tempo, #unidadeTempo, #percentualDI_CDB, #percentualDI_LCX, #taxaDI");
const atualizarResultadosDebounced = debounce(atualizarResultados, 300);
inputs.forEach(input => input.addEventListener("input", atualizarResultadosDebounced));

// Chama a função ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    atualizarDataAtual();
    atualizarTaxaDI(); // Atualiza a Taxa DI ao carregar a página
});
