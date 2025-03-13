import { ChainId } from '@/data-model/ethereum/EthereumType';
import { User } from '@/data-model/user/UserType';
import { LoginRequest } from '@/pages/api/auth/login';
import { usePreferredWalletClient } from '@/queries/EthereumQuery';
import { ACTIVE_USER_QUERY_KEY } from '@/queries/UserQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSiweMessage, generateSiweNonce } from 'viem/siwe';

export const useLoginOrCreateUser = ({
  onLogin,
}: {
  onLogin?: (data: User) => void;
}) => {
  const queryClient = useQueryClient();
  const walletClient = usePreferredWalletClient();

  const { mutateAsync: login } = useMutation({
    mutationFn: async () => {
      if (walletClient.ready === false) return;

      // Create SIWE message
      const message = createSiweMessage({
        domain: window.location.host,
        address: walletClient.client.account.address,
        statement: 'Sign in to Drip',
        uri: window.location.origin,
        version: '1',
        chainId: ChainId.BASE,
        nonce: generateSiweNonce(),
      });

      // Sign message
      const signature = await walletClient.client.signMessage({
        message,
      });

      const loginRequest: LoginRequest = {
        message,
        signature,
      };

      // Verify signature on backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginRequest),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.message || 'Login failed');
      }

      const user = await res.json();

      await queryClient.refetchQueries({ queryKey: [ACTIVE_USER_QUERY_KEY] });
      onLogin?.(user);
      return user;
    },
  });

  return login;
};
