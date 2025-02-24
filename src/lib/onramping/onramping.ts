export const MIN_USDC_ONRAMP_AMOUNT = 5;

export const ONRAMP_TRANSACTION_ID_COOKIE_NAME = 'onramp-transaction-id';

export const getOnrampCallbackUrl = (referrerUrl: string) => {
  const [baseUrl] = referrerUrl.split('?');
  return `${baseUrl}?onrampCallback=true`;
};
