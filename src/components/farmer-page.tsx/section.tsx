import { Divider } from '../ui/divider';
import { Headline } from '../ui/typography';

export const FarmerSection = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <div className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0">
      <Headline className="px-6">{title}</Headline>
      {children}
    </div>
  );
};
