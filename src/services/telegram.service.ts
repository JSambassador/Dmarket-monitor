/// <reference path="../types/telegram-bot-client.d.ts" />
import TelegramBotClient from 'telegram-bot-client';
import * as dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

export class TelegramService {
  private static TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
  private static TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
  private static client: TelegramBotClient;

  static {
    this.initialize();
    this.client = new TelegramBotClient(TelegramService.TELEGRAM_BOT_TOKEN);
  }

  static async initialize(): Promise<void> {
    console.log('process.env - ', process.env.DMARKET_API_URL, this.TELEGRAM_CHAT_ID);
  }

  static async sendMessage(message: string): Promise<void> {
    await this.client.sendMessage(
      this.TELEGRAM_CHAT_ID,
      message
    );
  }
}