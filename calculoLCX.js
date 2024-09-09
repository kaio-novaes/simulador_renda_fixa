// Função para calcular rendimento de LCI/LCA
export function calcularRendimentoLCX(valorInvestido, taxaDI, dias) {
    const taxaDiaria = (1 + taxaDI / 100) ** (1 / 365) - 1;
    let valorFinal = valorInvestido;
    for (let i = 0; i < dias; i++) {
        valorFinal *= (1 + taxaDiaria);
    }
    return valorFinal - valorInvestido; // Retorna apenas o rendimento bruto
}
