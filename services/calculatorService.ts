
import { AppState, CalcResults, CalcMode } from '../types';

export const calculateResults = (state: AppState): CalcResults => {
  const {
    mode,
    carPrice,
    purchaseDate,
    saleDate,
    opportunityRateMonthly,
    freight,
    taxRate,
    targetSalePrice,
    targetNetProfit
  } = state;

  const d1 = new Date(purchaseDate);
  const d2 = new Date(saleDate);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return createEmptyResults("Datas inválidas");
  }

  const diffTime = d2.getTime() - d1.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return createEmptyResults("Data de venda anterior à compra");
  }

  const opportunityRateAnnual = (opportunityRateMonthly || 0) * 12;
  const dailyRate = (opportunityRateAnnual / 100) / 365;
  const oppCost = (carPrice || 0) * dailyRate * days;

  const invBase = (carPrice || 0) + oppCost;
  const totalCost = invBase + (freight || 0);

  let salePrice = 0;
  let netProfit = 0;
  let grossProfit = 0;
  let taxAmount = 0;

  if (mode === CalcMode.SALE_TO_PROFIT) {
    salePrice = targetSalePrice || 0;
    grossProfit = salePrice - totalCost;
    taxAmount = grossProfit > 0 ? grossProfit * (taxRate / 100) : 0;
    netProfit = grossProfit - taxAmount;
  } else {
    netProfit = targetNetProfit || 0;
    const factor = (1 - (taxRate / 100));
    grossProfit = factor > 0 ? netProfit / factor : netProfit;
    salePrice = totalCost + grossProfit;
    taxAmount = grossProfit > 0 ? grossProfit * (taxRate / 100) : 0;
  }

  const roi = invBase > 0 ? (netProfit / invBase) * 100 : 0;

  return {
    days,
    oppCost,
    invBase,
    totalCost,
    salePrice,
    grossProfit,
    taxAmount,
    netProfit,
    roi,
    opportunityRateAnnual
  };
};

const createEmptyResults = (error: string): CalcResults => ({
  days: 0,
  oppCost: 0,
  invBase: 0,
  totalCost: 0,
  salePrice: 0,
  grossProfit: 0,
  taxAmount: 0,
  netProfit: 0,
  roi: 0,
  opportunityRateAnnual: 0,
  error
});

export const formatBRL = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(val || 0);
};

export const formatPercent = (val: number) => {
  return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};
