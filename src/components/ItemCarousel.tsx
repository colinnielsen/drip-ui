import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { DrinkDrawer, DrawerProps } from "./Drawer";

export function ItemCarousel({
  title,
  drawerProps,
}: {
  title: string;
  drawerProps: DrawerProps[];
}) {
  return (
    <div className="w-full py-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl text-medium font-normal">{title}</h2>
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full max-w-sm"
        >
          <CarouselContent>
            {drawerProps.map((drawer, index) => (
              <CarouselItem key={index} className=" basis-5/12">
                <DrinkDrawer
                  item={drawer.item}
                  category={drawer.category}
                  itemOptions={drawer.itemOptions}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
