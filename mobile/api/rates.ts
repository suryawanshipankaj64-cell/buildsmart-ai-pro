import { apiClient } from './client';

export interface AdminRates {
  baseRatePerSqFt: number;
  standardRatePerSqFt?: number;
  premiumRatePerSqFt?: number;
  luxuryRatePerSqFt?: number;
  cementBagRate: number;
  steelKgRate: number;
  sandCftRate: number;
  aggregateCftRate: number;
  brickRate: number;
  masonDailyWage: number;
  helperDailyWage: number;
}

export async function fetchAdminRates(): Promise<AdminRates> {
  try {
    return await apiClient<AdminRates>('/admin/rates');
  } catch (err) {
    return {
      baseRatePerSqFt: 1800,
      standardRatePerSqFt: 1800,
      premiumRatePerSqFt: 2200,
      luxuryRatePerSqFt: 3100,
      cementBagRate: 380,
      steelKgRate: 65,
      sandCftRate: 55,
      aggregateCftRate: 42,
      brickRate: 9,
      masonDailyWage: 950,
      helperDailyWage: 550,
    };
  }
}

export async function updateAdminRates(rates: Partial<AdminRates>): Promise<AdminRates> {
  return await apiClient<AdminRates>('/admin/rates', {
    method: 'POST',
    body: JSON.stringify(rates) as any,
  });
}


