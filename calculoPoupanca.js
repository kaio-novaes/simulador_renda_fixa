// Função para calcular rendimento da poupança
export function calcularRendimentoPoupanca(valorInvestido, taxaMensal, dias) {
    const taxaDiaria = (1 + taxaMensal) ** (1 / 30.41666666666667) - 1; // Converter taxa mensal para taxa diária
    let rendimentoBruto = valorInvestido;
    for (let i = 0; i < dias; i++) {
        rendimentoBruto *= (1 + taxaDiaria);
    }
    return rendimentoBruto - valorInvestido; // Retorna apenas o rendimento bruto
}
