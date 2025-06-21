import { getMetalApiKey, getMetalDripTokenAddress } from '@/lib/constants';
import { UUID } from '@/data-model/_common/type/CommonType';
import { Address } from 'viem';

type MetalDistributionMetadata = {
  reason: string;
  orderId: string; // UUID as string
  userId: string; // UUID as string
  [key: string]: string | number | boolean; // Allow other metadata
};

type CreateDistributionRequest = {
  sendToAddress: Address;
  amount: number;
};

type CreateDistributionResponse = {
  success: boolean;
  id?: string;
};

type HolderResponse = {
  success: boolean;
};

class MetalClient {
  private apiKey: string | undefined;
  private baseApiUrl = 'https://api.metal.build';

  constructor() {
    this.apiKey = getMetalApiKey();

    if (!this.apiKey) {
      console.warn(
        '[MetalClient] API Key is missing. Metal API calls may fail.',
      );
    }
  }

  private async fetchApi<TResponse>(
    endpoint: string,
    options: RequestInit,
  ): Promise<TResponse> {
    if (!this.apiKey) {
      throw new Error('Metal API Key is not configured.');
    }

    const url = `${this.baseApiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Metal API Error (${response.status}): ${response.statusText}. URL: ${url}, Body: ${errorBody}`,
      );
      throw new Error(
        `Metal API request failed with status ${response.status}`,
      );
    }

    // Handle cases where response might be empty (e.g., 204 No Content)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as TResponse;
    } else {
      // Return a default success object or handle differently if needed
      return { success: true } as unknown as TResponse;
    }
  }

  /**
   * Distributes a specified amount of a token to a recipient address.
   * Uses the token's contract address in the endpoint.
   * See: https://docs.metal.build/quickstart#4-distribute-tokens
   */
  async distributeTokens(
    request: CreateDistributionRequest,
  ): Promise<CreateDistributionResponse> {
    const dripTokenAddress = getMetalDripTokenAddress();

    const endpoint = `/token/${dripTokenAddress}/distribute`;
    const body = {
      sendToAddress: request.sendToAddress,
      amount: request.amount,
    };

    return this.fetchApi<CreateDistributionResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Gets or creates a holder wallet for a given user ID.
   * See: https://docs.metal.build/quickstart#3-get-or-create-holder
   */
  async getOrCreateHolder(userId: UUID): Promise<HolderResponse> {
    const endpoint = `/holder/${userId}`;
    return this.fetchApi<HolderResponse>(endpoint, {
      method: 'PUT',
    });
  }
}

// Create a singleton instance
const metalClient = new MetalClient();

export { metalClient, MetalClient }; // Export both instance and class
export type {
  CreateDistributionRequest,
  CreateDistributionResponse,
  MetalDistributionMetadata,
};
