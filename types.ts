
export enum CalcMode {
  SALE_TO_PROFIT = 'SALE_TO_PROFIT',
  PROFIT_TO_SALE = 'PROFIT_TO_SALE'
}

export interface AppState {
  mode: CalcMode;
  carModel: string; // Novo
  carYear: string;  // Novo
  carColor: string; // Novo
  carOrigin: string; // Novo
  carPrice: number;
  purchaseDate: string;
  saleDate: string;
  opportunityRateMonthly: number;
  freight: number;
  taxRate: number;
  targetSalePrice: number;
  targetNetProfit: number;
  quality: number;
}

export interface CalcResults {
  days: number;
  oppCost: number;
  invBase: number;
  totalCost: number;
  salePrice: number;
  grossProfit: number;
  taxAmount: number;
  netProfit: number;
  roi: number;
  opportunityRateAnnual: number;
  error?: string;
}
