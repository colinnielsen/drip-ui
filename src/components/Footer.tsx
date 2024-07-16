import { TESTING_USER_UUID } from '@/data-model/user/UserType';
import { useCart } from '@/queries/OrderQuery';
import { CartFooter } from './cart/drawer';
import { HomeSvg, MapSvg, ProfileSvg } from './Helpers';

export function Footer() {
  const { data: cart } = useCart(TESTING_USER_UUID);

  return (
    <footer className="fixed bottom-0 w-full">
      {!!cart && <CartFooter />}
      <div className="flex justify-between bg-white py-4">
        <div className="flex justify-center w-1/3">
          <HomeSvg />
        </div>
        <div className="flex justify-center w-1/3">
          <MapSvg />
        </div>
        <div className="flex justify-center w-1/3">
          <ProfileSvg />
        </div>
      </div>
    </footer>
  );
}
