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

export type GroupBy = "currency" | "department" | "country";

// A department name or a country code, with statistics within one currency.
export type GroupStatistics = Omit<CurrencyStatistics, "currency"> & {
  key: string;
};

export type AnalyticsResponse = {
  group_by: GroupBy;
  currencies: (CurrencyStatistics & { groups?: GroupStatistics[] })[];
};
