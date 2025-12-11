/**
 * Formatea un número como moneda en formato argentino: $X.XXX.XXX,XX
 * @param amount - El monto a formatear
 * @param showDecimals - Si mostrar decimales (default: true)
 * @returns String formateado como moneda argentina
 */
export function formatCurrency(amount: number | null | undefined, showDecimals: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "N/A";
  }

  // Si el monto es 0, retornar "Gratuito"
  if (amount === 0) {
    return "Gratuito";
  }

  // Formatear con separadores argentinos
  const parts = amount.toFixed(showDecimals ? 2 : 0).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';

  // Agregar puntos como separadores de miles
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Si hay decimales, agregarlos con coma
  if (showDecimals && decimalPart) {
    return `$${formattedInteger},${decimalPart}`;
  }

  return `$${formattedInteger}`;
}

