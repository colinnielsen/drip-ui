import { UUID } from 'crypto';
import { FarmerAllocation, Farmer } from './FarmerType';

export const getTotalAllocationBPS = (
  allocations: FarmerAllocation[],
): number => {
  return allocations?.reduce((acc, curr) => curr.allocationBPS + acc, 0) ?? 0;
};

export const createFarmer = (data: Farmer): Farmer => {
  return {
    ...data,
  };
};
