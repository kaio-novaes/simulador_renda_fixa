const iofTable = [96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0];

// Função para calcular rendimento de CDB/RDB
export function calcularRendimentoCDB(valorInvestido, taxaDI, dias) {
    const taxaDiaria = (1 + taxaDI / 100) ** (1 / 365) - 1;
    let valorFinal = valorInvestido;
    for (let i = 0; i < dias; i++) {
        valorFinal *= (1 + taxaDiaria);
    }
    return valorFinal - valorInvestido;
}

// Função para calcular a alíquota de IR com base no número de dias
export function calcularAliquotaIR(dias) {
    if (dias <= 180) return 22.5;
    if (dias <= 360) return 20;
    if (dias <= 720) return 17.5;
    return 15;
}

// Função para calcular o IOF
export function calcularIOF(valorInvestido, rendimentoBruto, dias) {
    const index = Math.min(dias - 1, 29); // O índice vai de 0 a 29 para 30 dias
    const aliquotaIOF = iofTable[index] / 100; // Convertendo para uma taxa decimal
    return rendimentoBruto * aliquotaIOF;
}
