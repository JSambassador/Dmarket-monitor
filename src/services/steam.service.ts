import axios from 'axios';

export class SteamService {
  private static STEAM_API_KEY = process.env.STEAM_API_KEY!;
  private static CACHE_DURATION = parseInt(process.env.CACHE_DURATION || '60') * 1000; // в секундах

  private static cache: { [key: string]: { stickerPrices: number[]; charmPrice: number; lastUpdated: number } } = {};

  static async getStickerAndCharmPrices(itemName: string): Promise<[number[], number]> {
    const cacheKey = `sticker-charm-${itemName}`;
    if (this.cache[cacheKey] && this.cache[cacheKey].lastUpdated + this.CACHE_DURATION > Date.now()) {
        return [this.cache[cacheKey].stickerPrices, this.cache[cacheKey].charmPrice];
    }

    try {
        // Получаем информацию о стикерах
        const stickerResponse = await axios.get(`https://steamcommunity.com/market/priceoverview`, {
            params: {
                appid: '730', // CS:GO App ID
                market_hash_name: `${itemName} Sticker`,
                currency: 1 // USD
            },
            headers: {
                'Authorization': `Bearer ${this.STEAM_API_KEY}`
            }
        });

        // Получаем информацию о брелке
        const charmResponse = await axios.get(`https://steamcommunity.com/market/priceoverview`, {
            params: {
                appid: '730',
                market_hash_name: `${itemName} Charm`,
                currency: 1
            },
            headers: {
                'Authorization': `Bearer ${this.STEAM_API_KEY}`
            }
        });

        const stickerPrices = stickerResponse.data.prices?.map((price: string) => parseFloat(price)) || [];
        const charmPrice = charmResponse.data.lowest_price ? parseFloat(charmResponse.data.lowest_price.replace('$', '')) : 0;

        // Добавляем задержку между запросами, чтобы не превысить лимит API
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.cache[cacheKey] = { stickerPrices, charmPrice, lastUpdated: Date.now() };
        return [stickerPrices, charmPrice];
    } catch (error) {
        console.error('Error fetching Steam prices:', error);
        return [[], 0];
    }
}
}