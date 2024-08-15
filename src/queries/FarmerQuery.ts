import { USDC } from '@/data-model/_common/currency/USDC';
import {
  Farmer,
  FarmerMessage,
  FarmerMessageWithUser,
} from '@/data-model/farmer/FarmerType';
import { BASE_CLIENT, USDC_INSTANCE } from '@/lib/ethereum';
import { axiosFetcher, minutes } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UUID } from 'crypto';
import { useWalletClient } from './EthereumQuery';

//
//// QUERIES
//
export const useFarmers = () =>
  useQuery({
    queryKey: ['farmers'],
    queryFn: () => axiosFetcher<Farmer[]>('/api/farmers'),
    staleTime: minutes(30),
  });

export const farmerQuery = (id?: UUID, enabled: boolean = true) => {
  return {
    queryKey: ['farmer', id],
    queryFn: () => axiosFetcher<Farmer>(`/api/farmers/${id}`),
    enabled: enabled && !!id,
    staleTime: minutes(30),
  };
};

export const useFarmer = (id?: UUID, enabled: boolean = true) =>
  useQuery({ ...farmerQuery(id, enabled), staleTime: minutes(30) });

const getFarmerMessages = (
  farmerId: string,
): Promise<FarmerMessageWithUser[]> => {
  return axiosFetcher<FarmerMessageWithUser[]>(
    `/api/farmers/${farmerId}/messages?limit=10`,
  );
};

export const useFarmerMessages = (farmerId: string) => {
  return useQuery({
    queryKey: ['farmer-messages', farmerId],
    queryFn: () => getFarmerMessages(farmerId),
  });
};

//
//// MUTATIONS
//

export const useDonate = () => {
  const wallet = useWalletClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { farmer: Farmer; amount: USDC }) => {
      if (!wallet) throw new Error('Wallet not connected');

      const [account] = await wallet.getAddresses();
      const { request } = await BASE_CLIENT.simulateContract({
        address: USDC_INSTANCE.address,
        abi: USDC_INSTANCE.abi,
        functionName: 'transfer',
        args: [variables.farmer.ethAddress, variables.amount.toWei()],
        account: account,
      });
      let txHash: `0x${string}` | null = null;
      try {
        txHash = await wallet.writeContract(request);
      } catch (e) {
        if (
          e instanceof Error &&
          !e.message.includes('User rejected the request')
        )
          throw e;
      }

      if (!txHash) return null;

      return axiosFetcher<FarmerMessage>(
        `/api/farmers/${variables.farmer.id}/donate`,
        {
          method: 'post',
          data: {
            amount: variables.amount,
            txHash,
          },
        },
      );
    },
    onSuccess: (_, vars) => {
      queryClient.refetchQueries({
        queryKey: ['farmer-messages', vars.farmer.id],
      });
    },
  });
};

export const useMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { farmer: Farmer; message: string }) => {
      return axiosFetcher<FarmerMessage>(
        `/api/farmers/${variables.farmer.id}/message`,
        {
          method: 'post',
          data: {
            message: variables.message,
          },
        },
      );
    },
    onSuccess: (_, vars) => {
      queryClient.refetchQueries({
        queryKey: ['farmer-messages', vars.farmer.id],
      });
    },
  });
};
