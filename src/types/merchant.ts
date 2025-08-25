export interface Merchant {
  merchantId: string;
  postalCode: string;
  longitude: number;
  latitude: number;
  tradingName: string;
  address1: string;
  address2: string;
  address3: string;
  country: string;
  state: string;
  city: string;
  distance?: number; // Added for proximity calculations
}

export interface MerchantWithDistance extends Merchant {
  distance: number;
}