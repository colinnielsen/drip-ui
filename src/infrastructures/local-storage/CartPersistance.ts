import { PersistanceLayer } from '@/data-model/_common/db/PersistanceType';
import { Unsaved } from '@/data-model/_common/type/CommonType';
import { Cart } from '@/data-model/cart/CartType';
import { genericError, UnimplementedPathError } from '@/lib/effect';
import { generateUUID, rehydrateData } from '@/lib/utils';
import { UUID } from 'crypto';

const CART_STORAGE_KEY = 'drip-cart';

async function save(unsavedCart: Unsaved<Cart> | Cart) {
  try {
    const cart = {
      id: 'id' in unsavedCart ? unsavedCart.id : generateUUID(),
      ...unsavedCart,
    } satisfies Cart;

    localStorage.setItem(`${CART_STORAGE_KEY}`, JSON.stringify(cart));

    return cart;
  } catch (error) {
    throw genericError(`Failed to save cart to localStorage ${error}`);
  }
}

async function findById(_id: UUID): Promise<Cart | null> {
  const cartJson = localStorage.getItem(`${CART_STORAGE_KEY}`);
  if (!cartJson) return null;

  try {
    const cart: Cart = rehydrateData(JSON.parse(cartJson));
    return cart;
  } catch (error) {
    genericError(`Failed to parse cart from localStorage ${error}`);
    return null;
  }
}

async function remove(_id: UUID) {
  localStorage.removeItem(CART_STORAGE_KEY);
}

async function get() {
  return findById(generateUUID());
}

interface CartPersistanceLayer extends PersistanceLayer<Cart> {
  get: () => Promise<Cart | null>;
}

export const LocalStorageCartPersistance: CartPersistanceLayer = {
  save,
  findById,
  findByUserId(_userId) {
    throw new UnimplementedPathError('not implemented');
  },
  remove,
  get,
};
