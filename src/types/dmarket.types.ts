export interface DMarketApiConfig {
    publicKey: string;
    secretKey: string;
    baseUrl: string;
  }
  
  export interface DMarketItem {
    type: string;
    name: string;
    currentPrice: number;
    lastSalePrice?: number;
    averageWeeklyPrice?: number;
    hasStickerOrCharm: boolean;
    isSouvenirItem: boolean;
    assetId?: string;
    gameId?: string;
    attributeMarkup?: number;
    sellerMarkup?: number;
    profitPercentage?: number;
  }