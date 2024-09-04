// Função para obter a taxa de poupança
async function obterTaxaPoupanca() {
    const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.195/dados/ultimos/1?formato=json';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();
        return parseFloat(data[0].valor);
    } catch (error) {
        console.error("Erro ao fazer requisição:", error);
        return null;
    }
}

// Função para calcular rendimento da poupança
function calcularRendimentoPoupanca(valorInvestido, taxaMensal, meses) {
    const taxaPoupanca = taxaMensal / 100;
    let rendimentoBruto = valorInvestido;
    for (let i = 0; i < meses; i++) {
        rendimentoBruto += rendimentoBruto * taxaPoupanca;
    }
    return rendimentoBruto;
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
        console.error("Erro ao fazer requisição:", error);
        return null;
    }
}

// Função para calcular rendimento de CDB/RDB
function calcularRendimentoCDB(valorInvestido, taxaDI, meses) {
    const taxaDiaria = (1 + taxaDI / 100) ** (1 / 12) - 1;
    let valorFinal = valorInvestido;
    for (let i = 0; i < meses; i++) {
        valorFinal *= (1 + taxaDiaria);
    }
    return valorFinal;
}

// Função para calcular a alíquota de IR com base no número de dias
function calcularAliquotaIR(dias) {
    if (dias <= 180) return 22.5;
    if (dias <= 360) return 20;
    if (dias <= 720) return 17.5;
    return 15;
}

// Função para obter a taxa DI para LCI/LCA (é a mesma que para CDB)
async function obterTaxaLCX() {
    return await obterTaxaDI();
}

// Função para calcular rendimento de LCI/LCA
function calcularRendimentoLCX(valorInvestido, taxaDI, meses) {
    const taxaDiaria = (1 + taxaDI / 100) ** (1 / 12) - 1;
    let valorFinal = valorInvestido;
    for (let i = 0; i < meses; i++) {
        valorFinal *= (1 + taxaDiaria);
    }
    return valorFinal;
}

// Função para converter unidades de tempo para meses
function converterParaMeses(tempo, unidade) {
    switch (unidade) {
        case 'dias':
            return Math.ceil(tempo / 30); // Aproxima para cima
        case 'anos':
            return Math.ceil(tempo * 12); // Converte anos para meses
        case 'meses':
        default:
            return tempo;
    }
}

// Função para atualizar os resultados
async function atualizarResultados() {
    const valorInvestido = parseFloat(document.getElementById("valorInvestido").value);
    const tempo = parseInt(document.getElementById("tempo").value);
    const unidade = document.getElementById("unidadeTempo").value;

    if (isNaN(valorInvestido) || valorInvestido <= 0 || isNaN(tempo) || tempo <= 0) {
        return;
    }

    const meses = converterParaMeses(tempo, unidade);

    // Atualiza o resultado da poupança
    const taxaPoupanca = await obterTaxaPoupanca();
    if (taxaPoupanca !== null) {
        const rendimentoLiquido = calcularRendimentoPoupanca(valorInvestido, taxaPoupanca, meses);
        const rendimentoBruto = rendimentoLiquido - valorInvestido;
        document.getElementById("resultadoPoupanca").innerHTML = `
            <h3>Poupança</h3>
            Valor da Aplicação: R$ ${valorInvestido.toFixed(2)}<br>
            Rendimento Bruto: R$ ${rendimentoBruto.toFixed(2)}<br>
            Valor Líquido: R$ ${rendimentoLiquido.toFixed(2)}
        `;
    } else {
        document.getElementById("resultadoPoupanca").innerHTML = `<h3>Poupança</h3> Não foi possível obter a taxa de poupança.`;
    }

    // Atualiza o resultado do CDB/RDB
    const taxaDI = await obterTaxaDI();
    if (taxaDI !== null) {
        const rendimentoTotal = calcularRendimentoCDB(valorInvestido, taxaDI, meses);
        const rendimentoBruto = rendimentoTotal - valorInvestido;
        const aliquotaIR = calcularAliquotaIR(meses * 30.4166);
        const ir = rendimentoBruto * (aliquotaIR / 100);
        const rendimentoLiquido = valorInvestido + rendimentoBruto - ir;

        let irClass = '';
        if (aliquotaIR <= 180) irClass = 'ir-22-5';
        else if (aliquotaIR <= 360) irClass = 'ir-20';
        else if (aliquotaIR <= 720) irClass = 'ir-17-5';
        else irClass = 'ir-15';

        document.getElementById("resultadoCDB-RDB").innerHTML = `
            <h3>CDB/RDB</h3>
            Valor da Aplicação: R$ ${valorInvestido.toFixed(2)}<br>
            Rendimento Bruto: R$ ${rendimentoBruto.toFixed(2)}<br>
            Imposto de Renda (IR) <span class="ir-icon ${irClass}"></span>(${aliquotaIR}%): R$ ${ir.toFixed(2)}<br>
            Valor Líquido: R$ ${rendimentoLiquido.toFixed(2)}
        `;
    } else {
        document.getElementById("resultadoCDB-RDB").innerHTML = `<h3>CDB/RDB</h3> Não foi possível obter a taxa DI.`;
    }

    // Atualiza o resultado do LCI/LCA
    const taxaLCX = await obterTaxaLCX();
    if (taxaLCX !== null) {
        const rendimentoLiquido = calcularRendimentoLCX(valorInvestido, taxaLCX, meses);
        const rendimentoBruto = rendimentoLiquido - valorInvestido;

        document.getElementById("resultadoLCI-LCA").innerHTML = `
            <h3>LCI/LCA</h3>
            Valor da Aplicação: R$ ${valorInvestido.toFixed(2)}<br>
            Rendimento Bruto: R$ ${rendimentoBruto.toFixed(2)}<br>
            Valor Líquido: R$ ${rendimentoLiquido.toFixed(2)}
        `;
    } else {
        document.getElementById("resultadoLCI-LCA").innerHTML = `<h3>LCI/LCA</h3> Não foi possível obter a taxa DI.`;
    }
}

// Adiciona ouvintes de eventos para atualizar os resultados automaticamente
document.getElementById("valorInvestido").addEventListener("input", atualizarResultados);
document.getElementById("tempo").addEventListener("input", atualizarResultados);
document.getElementById("unidadeTempo").addEventListener("change", atualizarResultados);