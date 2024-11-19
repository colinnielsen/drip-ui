import { PersistanceLayer } from '@/data-model/_common/db/PersistanceType';
import { SquareConnection } from '@/data-model/square-connection/SquareConnectionType';
import SquareConnectionPersistance from '@/infrastructures/sql/SquareConnectionPersistance';

function getSquareService(
  persistanceLayer: PersistanceLayer<SquareConnection>,
) {
  return {
    ...persistanceLayer,
  };
}

export const SquareService = getSquareService(SquareConnectionPersistance);
