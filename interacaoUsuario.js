import { formatarTaxaDI, formatarMoeda, aplicarMascaraMoeda, formatarData } from './formatacao.js';
import { obterTaxaPoupanca, obterTaxaDI } from './api.js';
import { calcularRendimentoPoupanca } from './calculoPoupanca.js';
import { calcularRendimentoCDB, calcularAliquotaIR, calcularIOF } from './calculoCDBRDB.js';
import { calcularRendimentoLCX } from './calculoLCX.js';

// Função para atualizar a taxa DI no campo de entrada
let taxaDIAtual = null;

async function atualizarTaxaDI() {
    taxaDIAtual = await obterTaxaDI(); // Atualiza a taxa DI padrão
    const campoTaxaDI = document.getElementById("taxaDI");

    if (taxaDIAtual !== null) {
        campoTaxaDI.value = formatarTaxaDI(taxaDIAtual);
    } else {
        campoTaxaDI.value = "Não disponível";
    }
}

// Função para atualizar o elemento com a data atual
function atualizarDataAtual() {
    const elementoData = document.getElementById('dataAtual');
    const dataAtual = new Date();
    const dataFormatada = formatarData(dataAtual);
    elementoData.setAttribute('data-value', dataFormatada);
    elementoData.textContent = dataFormatada;
}

// Função para extrair valor numérico de um campo com máscara
const extrairValorNumerico = (valor) => {
    return parseFloat(valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
};

// Função para converter unidades de tempo para dias
function converterParaDias(tempo, unidade) {
    switch (unidade) {
        case 'dias':
            return tempo;
        case 'meses':
            return Math.round(tempo * 30.41); // Aproxima para o número médio de dias por mês
        case 'anos':
            return Math.round(tempo * 365); // Aproxima para o número de dias por ano
        default:
            throw new Error('Unidade de tempo desconhecida');
    }
}

// Função para atualizar os resultados
async function atualizarResultados() {
    const valorInvestido = extrairValorNumerico(document.getElementById("valorInvestido").value);
    const tempo = parseInt(document.getElementById("tempo").value);
    const unidade = document.getElementById("unidadeTempo").value;
    const taxaDIUsuario = document.getElementById("taxaDI").value.replace(',', '.'); // Valor inserido pelo usuário

    if (isNaN(valorInvestido) || valorInvestido <= 0 || isNaN(tempo) || tempo <= 0) {
        return;
    }

    const dias = converterParaDias(tempo, unidade);
    let taxaDI = taxaDIAtual; // Usar a taxa DI padrão inicialmente

    // Verifica se o usuário forneceu uma taxa DI e se ela é válida
    if (taxaDIUsuario) {
        const taxaDIUsuarioFloat = parseFloat(taxaDIUsuario);
        if (!isNaN(taxaDIUsuarioFloat) && taxaDIUsuarioFloat > 0) {
            taxaDI = taxaDIUsuarioFloat; // Usa a taxa fornecida pelo usuário
        } else {
            document.getElementById("taxaDI").value = formatarTaxaDI(taxaDIAtual); // Restaura a taxa padrão no campo de entrada
        }
    } else {
        document.getElementById("taxaDI").value = formatarTaxaDI(taxaDIAtual); // Restaura a taxa padrão no campo de entrada se vazio
    }

    // Atualiza o resultado da poupança
    const taxaPoupanca = await obterTaxaPoupanca();
    if (taxaPoupanca !== null) {
        const rendimentoBrutoPoupanca = calcularRendimentoPoupanca(valorInvestido, taxaPoupanca, dias);
        const rendimentoLiquidoPoupanca = valorInvestido + rendimentoBrutoPoupanca;

        document.getElementById("resultadoPoupanca").innerHTML = 
            `<h3>Poupança</h3>
            Valor da Aplicação: ${formatarMoeda(valorInvestido)}<br>
            Rendimento Bruto: ${formatarMoeda(rendimentoBrutoPoupanca)}<br>
            Valor Líquido: ${formatarMoeda(rendimentoLiquidoPoupanca)}`;
    } else {
        document.getElementById("resultadoPoupanca").innerHTML = `<h3>Poupança</h3> Não foi possível obter a taxa de poupança.`;
    }   

    // Atualiza o resultado do CDB/RDB
    if (taxaDI !== null) {
        const percentualDI_CDB = parseFloat(document.getElementById("percentualDI_CDB").value) || 100; // Define padrão de 100% se não fornecido
        const rendimentoBrutoCDB = calcularRendimentoCDB(valorInvestido, taxaDI * percentualDI_CDB / 100, dias);
        const ioef = calcularIOF(valorInvestido, rendimentoBrutoCDB, dias);
        const rendimentoBrutoComIOF = rendimentoBrutoCDB - ioef;
        const aliquotaIR = calcularAliquotaIR(dias);
        const ir = rendimentoBrutoComIOF * (aliquotaIR / 100);
        const rendimentoLiquidoCDB = valorInvestido + rendimentoBrutoComIOF - ir;

        let irClass = '';
        if (aliquotaIR <= 180) irClass = 'ir-22-5';
        else if (aliquotaIR <= 360) irClass = 'ir-20';
        else if (aliquotaIR <= 720) irClass = 'ir-17-5';
        else irClass = 'ir-15';

        document.getElementById("resultadoCDB-RDB").innerHTML = 
            `<h3>CDB/RDB</h3>
            Valor da Aplicação: ${formatarMoeda(valorInvestido)}<br>
            ${ioef > 0 ? `IOF: ${formatarMoeda(ioef)}<br>` : ''}
            Rendimento Bruto: ${formatarMoeda(rendimentoBrutoCDB)}<br>
            Imposto de Renda (IR) <span class="ir-icon ${irClass}"></span>(${aliquotaIR}%): ${formatarMoeda(ir)}<br>
            Valor Líquido: ${formatarMoeda(rendimentoLiquidoCDB)}`;
    } else {
        document.getElementById("resultadoCDB-RDB").innerHTML = `<h3>CDB/RDB</h3> Não foi possível obter a taxa DI.`;
    }

    // Atualiza o resultado do LCI/LCA
    const percentualDI_LCX = parseFloat(document.getElementById("percentualDI_LCX").value) || 100; // Define padrão de 100% se não fornecido
    if (taxaDI !== null) {
        const rendimentoBrutoLCX = calcularRendimentoLCX(valorInvestido, taxaDI * percentualDI_LCX / 100, dias);
        const rendimentoLiquidoLCX = valorInvestido + rendimentoBrutoLCX;

        document.getElementById("resultadoLCI-LCA").innerHTML = 
            `<h3>LCI/LCA</h3>
            Valor da Aplicação: ${formatarMoeda(valorInvestido)}<br>
            Rendimento Bruto: ${formatarMoeda(rendimentoBrutoLCX)}<br>
            Valor Líquido: ${formatarMoeda(rendimentoLiquidoLCX)}`;
    } else {
        document.getElementById("resultadoLCI-LCA").innerHTML = `<h3>LCI/LCA</h3> Não foi possível obter a taxa DI.`;
    }
}

// Adiciona evento de mudança ao formulário
const inputs = document.querySelectorAll("#valorInvestido, #tempo, #unidadeTempo, #percentualDI_CDB, #percentualDI_LCX, #taxaDI");
inputs.forEach(input => input.addEventListener("input", atualizarResultados));

// Chama a função ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    atualizarDataAtual();
    atualizarTaxaDI(); // Atualiza a Taxa DI ao carregar a página
});
