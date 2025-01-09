import { DMarketApiService } from './dmarket-api.service';
import { DMarketItem } from '../types/dmarket.types';
import axios from 'axios';
// import { load, Element } from 'cheerio';

export class DMarketService {
  private static DMARKET_URL = process.env.DMARKET_URL!;
  private static CACHE_DURATION = parseInt(process.env.CACHE_DURATION || '60') * 1000;
  private static cache: { [key: string]: { items: DMarketItem[]; lastUpdated: number } } = {};
  
  private static apiService: DMarketApiService;
  private static useApi: boolean;

  static initialize(useApi: boolean = true) {
    if (useApi) {
      this.apiService = DMarketApiService.getInstance({
        publicKey: process.env.DMARKET_PUBLIC_KEY!,
        secretKey: process.env.DMARKET_SECRET_KEY!,
        baseUrl: process.env.DMARKET_API_URL!,
      });
    }
    this.useApi = useApi;
  }

  static async getItems(): Promise<DMarketItem[]> {
    const cacheKey = 'items';
    if (this.cache[cacheKey] && this.cache[cacheKey].lastUpdated + this.CACHE_DURATION > Date.now()) {
      return this.cache[cacheKey].items;
    }

    let items: DMarketItem[];
    
    if (this.useApi) {
      items = await this.getItemsFromApi();
    } else {
      items = await this.getItemsFromWeb();
    }

    this.cache[cacheKey] = { items, lastUpdated: Date.now() };
    return items;
  }

  private static async getItemsFromApi(): Promise<DMarketItem[]> {
    try {
      const response = await this.apiService.getMarketItems({
        gameId: 'a8db', // CS2 game ID
        limit: 100,
      });

      const items: DMarketItem[] = [];

      for (const item of response.objects) {
        const priceHistory = await this.apiService.getItemPriceHistory({
          gameId: item.gameId,
          itemName: item.title,
          period: '7d'
        });

        items.push({
          type: item.type,
          name: item.title,
          currentPrice: parseFloat(item.price.USD),
          lastSalePrice: this.calculateLastSalePrice(priceHistory),
          averageWeeklyPrice: this.calculateAveragePrice(priceHistory),
          hasStickerOrCharm: item.extra?.hasStickers || item.extra?.hasCharm || false,
          isSouvenirItem: item.extra?.isSouvenir || false,
          assetId: item.assetId,
          gameId: item.gameId
        });
      }

      return items;
    } catch (error) {
      console.error('Error fetching items from DMarket API:', error);
      return [];
    }
  }

  private static calculateLastSalePrice(priceHistory: any): number {
    // Implement price history calculation logic
    return priceHistory.last?.price || 0;
  }

  private static calculateAveragePrice(priceHistory: any): number {
    // Implement average price calculation logic
    return priceHistory.average || 0;
  }

  // Previous web scraping method remains as fallback
  private static async getItemsFromWeb(): Promise<DMarketItem[]> {
        const cacheKey = 'items';
        if (this.cache[cacheKey] && this.cache[cacheKey].lastUpdated + this.CACHE_DURATION > Date.now()) {
          return this.cache[cacheKey].items;
        }
    
        const response = await axios.get(this.DMARKET_URL);
        const $ = load(response.data);
        const items: DMarketItem[] = [];
        $('.items-card').each((index: number, elem: Element) => {
          const type = $(elem).find('.items-card__category').text().trim();
          const name = $(elem).find('.items-card__title').text().trim();
          const currentPrice = parseFloat($(elem).find('.items-card__price').text().trim().replace('$', ''));
          const lastSalePrice = DMarketService.calculateLastSalePrice($(elem).find('.items-card__price-history').text());
          const averageWeeklyPrice = DMarketService.parseAverageWeeklyPrice($(elem).find('.items-card__price-history').text());
          const hasStickerOrCharm = $(elem).find('.items-card__tag').toArray().some(tag => ['Стикер', 'Брелок'].includes($(tag).text().trim()));
          const isSouvenirItem = $(elem).find('.items-card__tag').toArray().some(tag => ['Сувенир'].includes($(tag).text().trim()));
    
          items.push({ type, name, currentPrice, lastSalePrice, averageWeeklyPrice, hasStickerOrCharm, isSouvenirItem });
        });
    
        this.cache[cacheKey] = { items, lastUpdated: Date.now() };
        return items;
      }
    // ... existing web scraping code ...

  private static parseAverageWeeklyPrice(priceHistory: string): number {
    try {
      // Implement your price parsing logic here
      return 0; // Replace with actual implementation
    } catch (error) {
      console.error('Error parsing average weekly price:', error);
      return 0;
    }
  }
}