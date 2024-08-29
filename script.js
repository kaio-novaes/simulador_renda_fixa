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

function calcularRendimentoCDB(valorInvestido, taxaDI, meses) {
    const taxaDiaria = (1 + taxaDI / 100) ** (1 / 12) - 1;
    let valorFinal = valorInvestido;
    for (let i = 0; i < meses; i++) {
        valorFinal *= (1 + taxaDiaria);
    }
    return valorFinal;
}

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

function calcularRendimentoLCX(valorInvestido, taxaDI, meses) {
    const taxaDiaria = (1 + taxaDI / 100) ** (1 / 12) - 1;
    let valorFinal = valorInvestido;
    for (let i = 0; i < meses; i++) {
        valorFinal *= (1 + taxaDiaria);
    }
    return valorFinal;
}

// Função para atualizar os resultados
async function atualizarResultados() {
    const valorInvestido = parseFloat(document.getElementById("valorInvestido").value);
    const meses = parseInt(document.getElementById("meses").value);

    if (isNaN(valorInvestido) || valorInvestido <= 0 || isNaN(meses) || meses <= 0) {
        return;
    }

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

    const taxaDI = await obterTaxaDI();
    if (taxaDI !== null) {
        const rendimentoTotal = calcularRendimentoCDB(valorInvestido, taxaDI, meses);
        const rendimentoBruto = rendimentoTotal - valorInvestido;
        const aliquotaIR = calcularAliquotaIR(meses * 30.4166);
        const ir = rendimentoBruto * (aliquotaIR / 100);
        const rendimentoLiquido = valorInvestido + rendimentoBruto - ir;

        document.getElementById("resultadoCDB").innerHTML = `
            <h3>CDB</h3>
            Valor da Aplicação: R$ ${valorInvestido.toFixed(2)}<br>
            Rendimento Bruto: R$ ${rendimentoBruto.toFixed(2)}<br>
            Imposto de Renda (IR) (${aliquotaIR}%): R$ ${ir.toFixed(2)}<br>
            Valor Líquido: R$ ${rendimentoLiquido.toFixed(2)}
        `;
    } else {
        document.getElementById("resultadoCDB").innerHTML = `<h3>CDB</h3> Não foi possível obter a taxa DI.`;
    }

    const taxaLCX = await obterTaxaLCX();
    if (taxaLCX !== null) {
        const rendimentoLiquido = calcularRendimentoLCX(valorInvestido, taxaLCX, meses);
        const rendimentoBruto = rendimentoLiquido - valorInvestido;

        document.getElementById("resultadoLCI").innerHTML = `
            <h3>LCI/LCA</h3>
            Valor da Aplicação: R$ ${valorInvestido.toFixed(2)}<br>
            Rendimento Bruto: R$ ${rendimentoBruto.toFixed(2)}<br>
            Valor Líquido: R$ ${rendimentoLiquido.toFixed(2)}
        `;
    } else {
        document.getElementById("resultadoLCI").innerHTML = `<h3>LCI/LCA</h3> Não foi possível obter a taxa DI.`;
    }
}

// Adiciona ouvintes de eventos para atualizar os resultados automaticamente
document.getElementById("valorInvestido").addEventListener("input", atualizarResultados);
document.getElementById("meses").addEventListener("input", atualizarResultados);
