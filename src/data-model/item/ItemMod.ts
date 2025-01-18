import { Currency } from '../_common/currency';
import { UUID } from '../_common/type/CommonType';
import { ModSourceConfig, ModCategory } from './common';

//
//// MODS
//
type BaseMod = {
  id: UUID;
  /** the configuration object for the platform the mod came from: i.e., slice, square */
  __sourceConfig: ModSourceConfig;
  category: (ModCategory & {}) | null;
  name: string;
  price: Currency;
  quantity: number;
};

export type ItemMod = BaseMod;
