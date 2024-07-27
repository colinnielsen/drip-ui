import { Farmer } from '@/data-model/farmer/FarmerType';

export const FarmerPosts = ({ farmer: { posts } }: { farmer: Farmer }) => {
  if (!posts?.length) return null;
  return 'Updates';
};
