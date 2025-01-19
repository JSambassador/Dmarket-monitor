import { DMarketApiService } from './dmarket-api.service';
import axios from 'axios';

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    request: jest.fn()
  }))
}));

describe('DMarketApiService', () => {
  let service: DMarketApiService;
  let mockAxiosInstance: { request: jest.Mock };

  beforeEach(() => {
    mockAxiosInstance = {
      request: jest.fn()
    };
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    const config = {
      baseUrl: 'https://api.test.com',
      publicKey: 'test-public-key',
      secretKey: 'test-secret-key'
    };
    
    service = new DMarketApiService(config);
    jest.clearAllMocks();
  });

  describe('getItemPriceHistory', () => {
    it('should make a GET request with correct parameters', async () => {
      const mockResponse = {
        data: {
          prices: [
            { price: 100, timestamp: '2024-03-20T00:00:00Z' },
            { price: 110, timestamp: '2024-03-21T00:00:00Z' },
          ]
        }
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const params = {
        gameId: 'a8db',
        itemName: 'AK-47 | Asiimov',
        period: '24h',
        currency: 'USD'
      };

      const result = await service.getItemPriceHistory(params);

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('/marketplace-api/v1/price-history'),
        headers: expect.objectContaining({
          'X-Api-Key': 'test-public-key',
          'X-Request-Sign': expect.any(String)
        })
      }));
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors properly', async () => {
      // Arrange
      const errorMessage = 'API Error';
      mockAxiosInstance.request.mockRejectedValueOnce(new Error(errorMessage));

      const params = {
        gameId: 'a8db',
        itemName: 'AK-47 | Asiimov',
        currency: 'USD'
      };

      // Act & Assert
      await expect(service.getItemPriceHistory(params)).rejects.toThrow(errorMessage);
    });
  });
}); 