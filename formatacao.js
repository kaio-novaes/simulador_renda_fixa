// Função para formatar a taxa DI para exibição
export const formatarTaxaDI = (taxaDI) => {
    if (isNaN(taxaDI)) return 'Não disponível';
    return `${taxaDI.toFixed(2).replace('.', ',')}%`;
};

// Função para formatar valores monetários
export const formatarMoeda = (valor) => {
    if (isNaN(valor)) return 'R$ 0,00';
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Função para aplicar máscara monetária
export const aplicarMascaraMoeda = (valor) => {
    const valorNumerico = parseFloat(valor.replace(/\D/g, '')) / 100;
    return formatarMoeda(valorNumerico);
};

// Função para formatar a data como 'DD/MM'
export function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Meses são baseados em 0
    return `${dia}/${mes}`;
}
