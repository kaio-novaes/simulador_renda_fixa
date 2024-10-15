// Função para calcular rendimento da poupança
export function calcularRendimentoPoupanca(valorInvestido, taxaMensal, aporteMensal = 0, meses) {
    const taxaDiaria = (1 + taxaMensal) ** (1 / 30.41) - 1; // Converter taxa mensal para taxa diária
    let rendimentoBruto = valorInvestido; // Começa com o valor investido

    for (let i = 0; i < meses; i++) {
        // Rendimento do valor investido por 30,41 dias
        for (let j = 0; j < Math.round(30.41); j++) {
            rendimentoBruto *= (1 + taxaDiaria);
        }

        // Se houver aporte mensal, adiciona e calcula seu rendimento
        if (aporteMensal > 0) {
            rendimentoBruto += aporteMensal; // Adiciona o aporte mensal

            // Rendimento do aporte mensal por 30,41 dias
            for (let j = 0; j < Math.round(30.41); j++) {
                rendimentoBruto *= (1 + taxaDiaria);
            }
        }
    }

    // Retorna o rendimento bruto total
    return rendimentoBruto - (valorInvestido + (aporteMensal * meses)); // Rendimento bruto total
}