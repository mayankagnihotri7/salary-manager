export type CurrencyStatistics = {
  currency: string;
  headcount: number;
  min: string;
  avg: string;
  median: string;
  max: string;
};

export type DashboardResponse = {
  headcount: number;
  currencies: CurrencyStatistics[];
};
