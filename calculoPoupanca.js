// Função para calcular rendimento da poupança
export function calcularRendimentoPoupanca(valorInvestido, taxaMensal, aporteMensal = 0, dias) {
    const taxaDiaria = (1 + taxaMensal) ** (1 / 30.41666666666667) - 1; // Converter taxa mensal para taxa diária
    let rendimentoBruto = valorInvestido; // Começa com o valor investido

    // Rendimento do valor investido
    for (let i = 0; i < dias; i++) {
        rendimentoBruto *= (1 + taxaDiaria);
    }

    // Se houver aporte mensal, adiciona e calcula seu rendimento proporcional
    if (aporteMensal > 0) {
        const aporteProporcional = aporteMensal * (dias / 30.41); // Aporte proporcional ao número de dias
        rendimentoBruto += aporteProporcional; // Adiciona o aporte proporcional

        // Rendimento do aporte proporcional
        for (let i = 0; i < Math.round(dias); i++) {
            rendimentoBruto *= (1 + taxaDiaria);
        }
    }

    // Retorna o rendimento bruto total
    return rendimentoBruto - (valorInvestido + (aporteMensal * (dias / 30.41))); // Rendimento bruto total
}