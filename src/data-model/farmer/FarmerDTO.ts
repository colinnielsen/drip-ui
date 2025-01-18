import { FarmerAllocation } from './FarmerType';

export const getTotalAllocationBPS = (
  allocations: FarmerAllocation[],
): number => {
  return allocations?.reduce((acc, curr) => curr.allocationBPS + acc, 0) ?? 0;
};
