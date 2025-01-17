import { DMarketApiService } from "./dmarket-api.service";
import { DMarketItem } from "../types/dmarket.types";
import { chromium } from "playwright";
import { parse } from "node-html-parser";
import * as dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

export class DMarketService {
  private static DMARKET_URL = process.env.DMARKET_URL!;
  private static CACHE_DURATION =
    parseInt(process.env.CACHE_DURATION || "60") * 1000;
  private static cache: {
    [key: string]: { items: DMarketItem[]; lastUpdated: number };
  } = {};

  private static apiService: DMarketApiService;
  private static useApi: boolean;

  static initialize(useApi: boolean) {
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
    this.initialize(true);
    const cacheKey = "items";
    if (
      this.cache[cacheKey] &&
      this.cache[cacheKey].lastUpdated + this.CACHE_DURATION > Date.now()
    ) {
      return this.cache[cacheKey].items;
    }

    let items: DMarketItem[];

    // if (this.useApi = true) {
    //   items = await this.getItemsFromApi();
    // } else {
    //   items = await this.getItemsFromWeb();
    // }
    items = await this.getItemsFromApi();
    this.cache[cacheKey] = { items, lastUpdated: Date.now() };
    return items;
  }

  private static async getItemsFromApi(): Promise<DMarketItem[]> {
    try {
      const response = await this.apiService.getMarketItems({
        gameId: "a8db", // CS2 game ID
        limit: 10,
        currency: "USD"
      });

      const items: DMarketItem[] = [];

      for (const item of response.objects) {
        // const priceHistory = await this.apiService.getItemPriceHistory({
        //   gameId: item.gameId,
        //   itemName: item.title,
        //   period: "7d",
        //   currency: "USD"
        // });

        items.push({
          type: item.type,
          name: item.title,
          currentPrice: parseFloat(item.price.USD),
          // lastSalePrice: this.calculateLastSalePrice(priceHistory),
          // averageWeeklyPrice: this.calculateAveragePrice(priceHistory),
          hasStickerOrCharm:
            item.extra?.hasStickers || item.extra?.hasCharm || false,
          isSouvenirItem: item.extra?.isSouvenir || false,
          assetId: item.assetId,
          gameId: item.gameId,
        });
      }
      console.log('items - ', items);
      return items;
    } catch (error) {
      console.error("Error fetching items from DMarket API:", error);
      return [];
    }
  }

  private static calculateLastSalePrice(priceHistory: any): number {
    // TODO: Implement price history calculation logic
    return priceHistory.last?.price || 0;
  }

  private static calculateAveragePrice(priceHistory: any): number {
    // TODO: Implement average price calculation logic
    return priceHistory.average || 0;
  }

  // Previous web scraping method remains as fallback
  private static async getItemsFromWeb(): Promise<DMarketItem[]> {
    const cacheKey = "items";
    if (
      this.cache[cacheKey] &&
      this.cache[cacheKey].lastUpdated + this.CACHE_DURATION > Date.now()
    ) {
      return this.cache[cacheKey].items;
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(this.DMARKET_URL, { waitUntil: "networkidle" });
    const html = await page.content();
    await browser.close();

    const root = parse(html);
    const items: DMarketItem[] = [];
    root.querySelectorAll(".items-card").forEach((elem) => {
      const type =
        elem.querySelector(".items-card__category")?.textContent?.trim() || "";
      const name =
        elem.querySelector(".items-card__title")?.textContent?.trim() || "";
      const currentPrice = parseFloat(
        elem
          .querySelector(".items-card__price")
          ?.textContent?.trim()
          .replace("$", "") || "0"
      );
      const lastSalePrice = this.parseLastSalePrice(
        elem.querySelector(".items-card__price-history")?.textContent || ""
      );
      const averageWeeklyPrice = this.parseAverageWeeklyPrice(
        elem.querySelector(".items-card__price-history")?.textContent || ""
      );
      const hasStickerOrCharm = elem
        .querySelectorAll(".items-card__tag")
        .some((tag) =>
          ["Стикер", "Брелок"].includes(tag.textContent?.trim() || "")
        );
      const isSouvenirItem = elem
        .querySelectorAll(".items-card__tag")
        .some((tag) => ["Сувенир"].includes(tag.textContent?.trim() || ""));

      items.push({
        type,
        name,
        currentPrice,
        lastSalePrice,
        averageWeeklyPrice,
        hasStickerOrCharm,
        isSouvenirItem,
      });
    });

    this.cache[cacheKey] = { items, lastUpdated: Date.now() };
    return items;
  }
  // ... existing web scraping code ...
  private static parseLastSalePrice(priceHistory: string): number {
    try {
      const priceMatch = priceHistory.match(/Last Sale:\s*\$(\d+\.?\d*)/i);
      return priceMatch ? parseFloat(priceMatch[1]) : 0;
    } catch (error) {
      console.error("Error parsing last sale price:", error);
      return 0;
    }
  }

  private static parseAverageWeeklyPrice(priceHistory: string): number {
    try {
      const weeklyMatch = priceHistory.match(
        /Weekly Average:\s*\$(\d+\.?\d*)/i
      );
      return weeklyMatch ? parseFloat(weeklyMatch[1]) : 0;
    } catch (error) {
      console.error("Error parsing weekly average price:", error);
      return 0;
    }
  }
}
