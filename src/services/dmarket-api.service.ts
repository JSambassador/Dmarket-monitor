import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface DMarketApiConfig {
  baseUrl: string;
  publicKey: string;
  secretKey: string;
}

export class DMarketApiService {
  private static instance: DMarketApiService;
  private apiClient: AxiosInstance;
  private config: DMarketApiConfig;

  private constructor(config: DMarketApiConfig) {
    this.config = config;
    this.apiClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  static getInstance(config: DMarketApiConfig): DMarketApiService {
    if (!DMarketApiService.instance) {
      DMarketApiService.instance = new DMarketApiService(config);
    }
    return DMarketApiService.instance;
  }

  private generateSignature(method: string, path: string, body: string = ''): string {
    const timestamp = Date.now().toString();
    const stringToSign = `${method}${path}${body}${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(stringToSign)
      .digest('hex');
    
    return `${timestamp}:${signature}`;
  }

  private async makeRequest(method: string, path: string, data?: any) {
    const body = data ? JSON.stringify(data) : '';
    const signature = this.generateSignature(method, path, body);

    const headers = {
      'X-Api-Key': this.config.publicKey,
      'X-Request-Sign': signature,
    };

    try {
      const response = await this.apiClient.request({
        method,
        url: path,
        headers,
        data: body || undefined,
      });
      return response.data;
    } catch (error) {
      console.error('DMarket API Error:', error);
      throw error;
    }
  }

  async getMarketItems(params: {
    gameId?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    title?: string;
    currency: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const path = `/exchange/v1/market/items?${queryParams.toString()}`;
    return this.makeRequest('GET', path);
  }

  async getItemPriceHistory(params: {
    gameId: string;
    itemName: string;
    period?: string;
    currency: string;
  }) {
    const queryParams = new URLSearchParams(params as any);
    const path = `/price-history/v1/items?${queryParams.toString()}`;
    return this.makeRequest('GET', path);
  }
}