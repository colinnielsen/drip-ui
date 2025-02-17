import { QueriedSquareLocation } from '@/data-model/_external/data-sources/square/SquareType';
import { mapSquareExternalIdToLocationId } from '@/data-model/shop/ShopDTO';
import { SquareShopConfig } from '@/data-model/shop/ShopType';
import { MinSquareConnection } from '@/data-model/square-connection/SquareConnectionType';
import { ApiRoute } from '@/lib/next';
import { err } from '@/lib/utils';
import { authenticationService } from '@/services/AuthenticationService';
import ShopService from '@/services/ShopService';
import { SquareService } from '@/services/SquareService';
import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from 'square';

export type SquareConnectionResponse = {
  connection: MinSquareConnection;
  squareShopConfigs: SquareShopConfig[];
  squareLocations: QueriedSquareLocation[];
};

export default ApiRoute(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  const user = await authenticationService.checkAuthentication_sync(req, res);

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const connection = await SquareService.findByUserId(user.id);
    if (!connection)
      return res.status(404).json({ error: 'Connection not found' });

    const { refreshToken: _, accessToken: __, ...minConnection } = connection;

    const squareshopConfigs: SquareShopConfig[] =
      await ShopService.findSquareShopConfigsByMerchantId(
        connection.merchantId,
      ).then(i =>
        i.filter((i): i is SquareShopConfig => i.__type === 'square'),
      );

    const locations = await SquareService.fetchLocationsByMerchantId(
      connection.merchantId,
    ).then(l =>
      l
        ?.map(l => ({
          id: l.id || err('Location id not found'),
          name: l.name || err('Location name not found'),
          address: l.address,
          type:
            (l.type as 'PHYSICAL' | 'MOBILE') || err('Location type not found'),
          logoUrl: l.logoUrl || err('Location logoUrl not found'),
          businessName:
            l.businessName || err('Location businessName not found'),
          status:
            (l.status as 'ACTIVE' | 'INACTIVE') ||
            err('Location status not found'),
          added: squareshopConfigs.some(
            c => mapSquareExternalIdToLocationId(c.externalId) === l.id,
          ),
        }))
        .sort((a, b) =>
          a.status === 'ACTIVE' || a.type === 'PHYSICAL' ? -1 : 1,
        ),
    );

    const response: SquareConnectionResponse = {
      connection: minConnection,
      squareShopConfigs: squareshopConfigs,
      squareLocations: locations,
    };

    return res.status(200).json(response);
  } catch (e: any) {
    if (e instanceof ApiError && e.errors?.some(e => e.code === 'UNAUTHORIZED'))
      return res.status(401).json({ error: 'Unauthorized' });
    else throw e;
  }
}, 'square-connection');
