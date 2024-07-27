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
    <div className="flex flex-col gap-5 py-5">
      <Headline className="px-6">{title}</Headline>
      {children}
    </div>
  );
};
