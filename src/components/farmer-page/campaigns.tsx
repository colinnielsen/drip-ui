import { Farmer } from '@/data-model/farmer/FarmerType';
import { Headline } from '../ui/typography';
import { Divider } from '../ui/divider';

export const FarmerCampaigns = ({
  farmer: { campaigns },
}: {
  farmer: Farmer;
}) => {
  if (!campaigns?.length) return null;
  return 'Campaigns';
};
