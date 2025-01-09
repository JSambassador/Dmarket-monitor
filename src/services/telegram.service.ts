import { TelegramBotClient, SendMessageOptions } from 'telegram-bot-client';

export class TelegramService {
  private static TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
  private static TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

  private static client = new TelegramBotClient(this.TELEGRAM_BOT_TOKEN);

  static async sendMessage(message: string): Promise<void> {
    const options: SendMessageOptions = {
      chat_id: this.TELEGRAM_CHAT_ID,
      text: message
    };
    await this.client.sendMessage(options);
  }
}