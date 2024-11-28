const notAllowedOnClient = () => {
  if (typeof window !== 'undefined')
    throw Error('never do this on the client dawg');
};

export const getPrivyAppId = (): string => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (appId) return appId;
  throw Error('undefined App ID');
};

export const getPrivySecret = (): string => {
  notAllowedOnClient();

  const secret = process.env.PRIVY_SECRET;
  if (secret) return secret;
  throw Error('undefined App Secret');
};

export const getSliceSubgraphApiKey = (): string => {
  const key = process.env.SLICE_SUBGRAPH_API_KEY;
  if (key) return key;
  throw Error('undefined Slice Subgraph API Key');
};

export const getSquareAppId = (): string => {
  const id = process.env.SQUARE_APP_ID;
  if (id) return id;
  throw Error('undefined Square App ID');
};

export const getSquareAppSecret = (): string => {
  notAllowedOnClient();

  const secret = process.env.SQUARE_APP_SECRET;
  if (secret) return secret;
  throw Error('undefined Square App Secret');
};

export const getEncryptionKey = (): string => {
  notAllowedOnClient();

  const key = process.env.ENCRYPTION_KEY;
  if (key) return key;
  throw Error('undefined Encryption Key');
};

export const getSquareAccessToken = (): string => {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (token) return token;
  throw Error('undefined Square Access Token');
};
