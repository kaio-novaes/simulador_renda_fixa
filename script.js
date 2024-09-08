// Função para formatar valores monetários
const formatarMoeda = (valor) => {
    if (isNaN(valor)) return 'R$ 0,00';
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Função para formatar entrada monetária para exibição
const aplicarMascaraMoeda = (valor) => {
    const valorNumerico = parseFloat(valor.replace(/\D/g, '')) / 100;
    return formatarMoeda(valorNumerico);
};

// Função para atualizar o valor do campo com a máscara aplicada
const atualizarCampoComMascara = (event) => {
    const campo = event.target;
    const valorOriginal = campo.value.replace(/\D/g, '');
    campo.value = aplicarMascaraMoeda(valorOriginal);
};

// Adiciona máscara ao campo de valor da aplicação
document.getElementById('valorInvestido').addEventListener('input', atualizarCampoComMascara);

// Função para extrair valor numérico de um campo com máscara
const extrairValorNumerico = (valor) => {
    return parseFloat(valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
};

// Função para formatar a data como 'DD/MM'
function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Meses são baseados em 0
    return `${dia}/${mes}`;
}

// Função para atualizar o elemento com a data atual
function atualizarDataAtual() {
    const elementoData = document.getElementById('dataAtual');
    const dataAtual = new Date();
    const dataFormatada = formatarData(dataAtual);
    elementoData.setAttribute('data-value', dataFormatada);
    elementoData.textContent = dataFormatada;
}

// Chama a função ao carregar a página
document.addEventListener('DOMContentLoaded', atualizarDataAtual);

// Função para obter a taxa de poupança
async function obterTaxaPoupanca() {
    const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.195/dados/ultimos/1?formato=json';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();
        return parseFloat(data[0].valor) / 100; // Converter para taxa decimal mensal
    } catch (error) {
        console.error("Erro ao fazer requisição de taxa de poupança:", error);
        return null;
    }
}

// Função para calcular rendimento da poupança
function calcularRendimentoPoupanca(valorInvestido, taxaMensal, dias) {
    const taxaDiaria = (1 + taxaMensal) ** (1 / 30.41) - 1; // Converter taxa mensal para taxa diária
    let rendimentoBruto = valorInvestido;
    for (let i = 0; i < dias; i++) {
        rendimentoBruto *= (1 + taxaDiaria);
    }
    return rendimentoBruto - valorInvestido; // Retorna apenas o rendimento bruto
}

// Função para obter a taxa DI
async function obterTaxaDI() {
    const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();
        return parseFloat(data[0].valor);
    } catch (error) {
        console.error("Erro ao fazer requisição de taxa DI:", error);
        return null;
    }
}

// Função para calcular rendimento de CDB/RDB
function calcularRendimentoCDB(valorInvestido, taxaDI, dias) {
    const taxaDiaria = (1 + taxaDI / 100) ** (1 / 365) - 1;
    let valorFinal = valorInvestido;
    for (let i = 0; i < dias; i++) {
        valorFinal *= (1 + taxaDiaria);
    }
    return valorFinal - valorInvestido;
}

// Função para calcular a alíquota de IR com base no número de dias
function calcularAliquotaIR(dias) {
    if (dias <= 180) return 22.5;
    if (dias <= 360) return 20;
    if (dias <= 720) return 17.5;
    return 15;
}

// Tabela de IOF
const iofTable = [96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0];

// Função para calcular o IOF
function calcularIOF(valorInvestido, rendimentoBruto, dias) {
    const index = Math.min(dias - 1, 29); // O índice vai de 0 a 29 para 30 dias
    const aliquotaIOF = iofTable[index] / 100; // Convertendo para uma taxa decimal
    return rendimentoBruto * aliquotaIOF;
}

// Função para obter a taxa DI para LCI/LCA (é a mesma que para CDB)
async function obterTaxaLCX() {
    return await obterTaxaDI();
}

// Função para calcular rendimento de LCI/LCA
function calcularRendimentoLCX(valorInvestido, taxaDI, dias) {
    const taxaDiaria = (1 + taxaDI / 100) ** (1 / 365) - 1;
    let valorFinal = valorInvestido;
    for (let i = 0; i < dias; i++) {
        valorFinal *= (1 + taxaDiaria);
    }
    return valorFinal - valorInvestido; // Retorna apenas o rendimento bruto
}

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

    if (isNaN(valorInvestido) || valorInvestido <= 0 || isNaN(tempo) || tempo <= 0) {
        return;
    }

    const dias = converterParaDias(tempo, unidade);

    // Atualiza o resultado da poupança
    const taxaPoupanca = await obterTaxaPoupanca();
    if (taxaPoupanca !== null) {
        const rendimentoBrutoPoupanca = calcularRendimentoPoupanca(valorInvestido, taxaPoupanca, dias);
        const rendimentoLiquidoPoupanca = valorInvestido + rendimentoBrutoPoupanca;

        document.getElementById("resultadoPoupanca").innerHTML = `
            <h3>Poupança</h3>
            Valor da Aplicação: ${formatarMoeda(valorInvestido)}<br>
            Rendimento Bruto: ${formatarMoeda(rendimentoBrutoPoupanca)}<br>
            Valor Líquido: ${formatarMoeda(rendimentoLiquidoPoupanca)}
        `;
    } else {
        document.getElementById("resultadoPoupanca").innerHTML = `<h3>Poupança</h3> Não foi possível obter a taxa de poupança.`;
    }   

    // Atualiza o resultado do CDB/RDB
    const taxaDI = await obterTaxaDI();
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

        document.getElementById("resultadoCDB-RDB").innerHTML = `
            <h3>CDB/RDB</h3>
            Valor da Aplicação: R$ ${valorInvestido.toFixed(2)}<br>
            ${ioef > 0 ? `IOF: R$ ${ioef.toFixed(2)}<br>` : ''}
            Rendimento Bruto: R$ ${rendimentoBrutoCDB.toFixed(2)}<br>
            Imposto de Renda (IR) <span class="ir-icon ${irClass}"></span>(${aliquotaIR}%): R$ ${ir.toFixed(2)}<br>
            Valor Líquido: R$ ${rendimentoLiquidoCDB.toFixed(2)}
        `;
    } else {
        document.getElementById("resultadoCDB-RDB").innerHTML = `<h3>CDB/RDB</h3> Não foi possível obter a taxa DI.`;
    }

    // Atualiza o resultado do LCI/LCA
    const percentualDI_LCX = parseFloat(document.getElementById("percentualDI_LCX").value) || 100; // Define padrão de 100% se não fornecido
    const taxaLCX = await obterTaxaLCX();
    if (taxaLCX !== null) {
        const rendimentoBrutoLCX = calcularRendimentoLCX(valorInvestido, taxaLCX * percentualDI_LCX / 100, dias);
        const rendimentoLiquidoLCX = valorInvestido + rendimentoBrutoLCX;

        document.getElementById("resultadoLCI-LCA").innerHTML = `
            <h3>LCI/LCA</h3>
            Valor da Aplicação: R$ ${valorInvestido.toFixed(2)}<br>
            Rendimento Bruto: R$ ${rendimentoBrutoLCX.toFixed(2)}<br>
            Valor Líquido: R$ ${rendimentoLiquidoLCX.toFixed(2)}
        `;
    } else {
        document.getElementById("resultadoLCI-LCA").innerHTML = `<h3>LCI/LCA</h3> Não foi possível obter a taxa DI.`;
    }
}

// Adiciona evento de mudança ao formulário
const inputs = document.querySelectorAll("#valorInvestido, #tempo, #unidadeTempo, #percentualDI_CDB, #percentualDI_LCX");
inputs.forEach(input => input.addEventListener("input", atualizarResultados));
