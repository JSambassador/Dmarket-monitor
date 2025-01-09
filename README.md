# DMarket Monitor

A Node.js application for monitoring DMarket prices and finding profitable trading opportunities.

## Features
- DMarket API integration
- Web scraping fallback option
- Steam market price tracking
- Telegram notifications
- Price history analysis
- Configurable profit calculations

## Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Run `npm install`
4. Run `npm start`

## Configuration
Set the following environment variables in `.env`:
- `DMARKET_API_URL`: DMarket API endpoint
- `DMARKET_PUBLIC_KEY`: Your DMarket API public key
- `DMARKET_SECRET_KEY`: Your DMarket API secret key
- `USE_DMARKET_API`: Set to 'true' to use API instead of web scraping
- `STEAM_API_KEY`: Your Steam API key
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Your Telegram chat ID
- `PROFIT_THRESHOLD`: Minimum profit percentage
- `CACHE_DURATION`: Cache duration in seconds
- `STICKER_MARKUP_COEFF`: Sticker markup coefficient
- `CHARM_MARKUP_COEFF`: Charm markup coefficient

## Usage
The monitor will:
1. Fetch items from DMarket
2. Check prices against Steam market
3. Calculate potential profit
4. Send notifications for profitable items

## License
MIT