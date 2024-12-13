import { Address, ApiError } from 'square';

export enum SquareOrderFulfillmentState {
  /** Indicates that the fulfillment has been proposed */
  PROPOSED = 'PROPOSED',

  /** Indicates that the fulfillment has been reserved */
  RESERVED = 'RESERVED',

  /** Indicates that the fulfillment has been prepared */
  PREPARED = 'PREPARED',

  /** Indicates that the fulfillment was successfully completed */
  COMPLETED = 'COMPLETED',

  /** Indicates that the fulfillment was canceled */
  CANCELED = 'CANCELED',

  /** Indicates that the fulfillment failed */
  FAILED = 'FAILED',
}

/**
 * Represents the possible states of a Square order.
 */
export enum SquareOrderStatus {
  /** Indicates that the order is open. Open orders can be updated. */
  OPEN = 'OPEN',

  /** Indicates that the order is completed. Completed orders are fully paid. This is a terminal state. */
  COMPLETED = 'COMPLETED',

  /** Indicates that the order is canceled. Canceled orders are not paid. This is a terminal state. */
  CANCELED = 'CANCELED',

  /**
   * Beta
   * Indicates that the order is in a draft state. Draft orders can be updated,
   * but cannot be paid or fulfilled.
   * @see https://developer.squareup.com/docs/orders-api/create-orders
   */
  DRAFT = 'DRAFT',
}

export class SquareError extends Error {
  constructor(message: string, errors?: ApiError['errors']) {
    const errorMessage = errors?.reduce(
      (acc, error) =>
        `${acc}\n${error.category}: ${error.code}: ${error.detail}${
          error.field ? ` (field: ${error.field})` : ''
        }`,
      `${message} \n`,
    );
    super(message + errorMessage);
  }
}

export type QueriedSquareLocation = {
  id: string;
  name: string;
  address?: Address;
  type: 'PHYSICAL' | 'MOBILE';
  logoUrl: string;
  businessName: string;
  status: 'ACTIVE' | 'INACTIVE';
  added: boolean;
};
