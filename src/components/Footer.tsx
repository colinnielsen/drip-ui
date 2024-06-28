import { Cart, CartBanner } from "./Cart";
import { HomeSvg, MapSvg, ProfileSvg } from "./Helpers";

export function Footer() {
  return (
    <footer className="fixed bottom-0 w-full">
      {/* <CartBanner /> */}
      <Cart />
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
