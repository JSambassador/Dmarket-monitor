declare module 'telegram-bot-client' {
  export interface SendMessageOptions {
    chat_id: string | number;
    text: string;
  }

  export default class TelegramBotClient {
    constructor(token: string);
    sendMessage(chatId: string | number, text: string): Promise<any>;
  }
} 