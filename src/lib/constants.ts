export const getPrivyAppId = (): string => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (appId) return appId;
  throw Error('undefined App ID');
};

export const getPrivySecret = (): string => {
  const secret = process.env.PRIVY_SECRET;
  if (secret) return secret;
  throw Error('undefined App Secret');
};
