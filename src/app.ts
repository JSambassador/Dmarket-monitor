import { DMarketService } from './services/dmarket.service';
import { SteamService } from './services/steam.service';
import { TelegramService } from './services/telegram.service';
import { DMarketItem } from './types/dmarket.types';

const PROFIT_THRESHOLD = parseFloat(process.env.PROFIT_THRESHOLD || '10');
const STICKER_MARKUP_COEFF = parseFloat(process.env.STICKER_MARKUP_COEFF || '0.1');
const CHARM_MARKUP_COEFF = parseFloat(process.env.CHARM_MARKUP_COEFF || '0.2');

class DMarketMonitor {
  async run(): Promise<void> {
    const items = await DMarketService.getItems();
    const profitableItems = await this.analyzeItems(items);
    if (profitableItems.length > 0) {
      await this.sendTelegramNotification(profitableItems);
    } else {
      console.log('Не найдено выгодных предметов.');
    }
  }

  private async analyzeItems(items: DMarketItem[]): Promise<DMarketItem[]> {
    const profitableItems: DMarketItem[] = [];
    for (const item of items) {
      if (!item.hasStickerOrCharm || item.isSouvenirItem) {
        continue;
      }

      const [stickerPrices, charmPrice] = await SteamService.getStickerAndCharmPrices(item.name);
      const attributeMarkup = this.calculateAttributeMarkup(stickerPrices, charmPrice);
      const sellerMarkup = item.currentPrice - item.lastSalePrice;
      const profitPercentage = ((attributeMarkup - sellerMarkup) / item.currentPrice) * 100;

      if (profitPercentage >= PROFIT_THRESHOLD) {
        profitableItems.push({ ...item, attributeMarkup, sellerMarkup, profitPercentage });
      }
    }
    return profitableItems;
  }

  private calculateAttributeMarkup(stickerPrices: number[], charmPrice: number): number {
    const stickerMarkup = stickerPrices.reduce((total, price) => total + price * STICKER_MARKUP_COEFF, 0);
    const charmMarkup = charmPrice * CHARM_MARKUP_COEFF;
    return stickerMarkup + charmMarkup;
  }

  private async sendTelegramNotification(items: DMarketItem[]): Promise<void> {
    for (const item of items) {
      const message = `
Найден выгодный предмет:
Тип: ${item.type}
Название: ${item.name}
Текущая цена: $${item.currentPrice}
Последняя цена продажи: $${item.lastSalePrice}
Средняя цена за неделю: $${item.averageWeeklyPrice}
Наличие наклеек или брелков: ${item.hasStickerOrCharm}
Сувенирный предмет: ${item.isSouvenirItem}
Наценка за атрибутику: $${item.attributeMarkup.toFixed(2)}
Наценка продавца: $${item.sellerMarkup.toFixed(2)}
Профит: ${item.profitPercentage.toFixed(2)}%
`;
      await TelegramService.sendMessage(message);
    }
  }
}

const monitor = new DMarketMonitor();
monitor.run();