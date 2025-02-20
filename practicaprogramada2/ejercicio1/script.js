document.getElementById('calculate').addEventListener('click', function() {
    const salary = parseFloat(document.getElementById('salary').value);
    
    if (isNaN(salary) || salary <= 0) {
        alert("Por favor, ingrese un salario válido.");
        return;
    }

    // Cálculo de cargas sociales CCSS (aproximadamente 10,67% en total)
    const socialCharges = salary * 0.1067;

    // Cálculo del impuesto sobre la renta
    let incomeTax = 0;
    const taxBrackets = [
        { limit: 0, rate: 0 },
        { limit: 941000, rate: 0.1 },
        { limit: 1381000, rate: 0.15 },
        { limit: 2423000, rate: 0.2 },
        { limit: 4845000, rate: 0.25},
        { limit: Infinity, rate: 0.25 }
    ];

    let taxableIncome = salary - socialCharges;

    for (let i = 1; i < taxBrackets.length; i++) {
        const previousLimit = taxBrackets[i - 1].limit;
        const currentLimit = taxBrackets[i].limit;
        const rate = taxBrackets[i].rate;

        if (taxableIncome > previousLimit) {
            const taxableAmount = Math.min(taxableIncome, currentLimit) - previousLimit;
            incomeTax += taxableAmount * rate;
        }
    }

    // Cálculo del salario neto
    const netSalary = salary - socialCharges - incomeTax;

    // Mostrar resultados
    document.getElementById('socialCharges').innerText = `Cargas Sociales: ₡${socialCharges.toFixed(2)}`;
    document.getElementById('incomeTax').innerText = `Impuesto sobre la Renta: ₡${incomeTax.toFixed(2)}`;
    document.getElementById('netSalary').innerText = `Salario Neto: ₡${netSalary.toFixed(2)}`;
});