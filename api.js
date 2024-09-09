
export async function obterTaxaPoupanca() {
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

export async function obterTaxaDI() {
    const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();
        return parseFloat(data[0].valor); // Retorna como percentual anual
    } catch (error) {
        console.error("Erro ao fazer requisição de taxa DI:", error);
        return null;
    }
}
