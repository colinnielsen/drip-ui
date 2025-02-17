import { ChainId } from '@/data-model/ethereum/EthereumType';
import { User } from '@/data-model/user/UserType';
import { LoginRequest } from '@/pages/api/auth/login';
import { useWalletClient } from '@/queries/EthereumQuery';
import { ACTIVE_USER_QUERY_KEY } from '@/queries/UserQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSiweMessage, generateSiweNonce } from 'viem/siwe';

// export const useLoginOrCreateUser = ({
//   onLogin,
// }: {
//   onLogin?: (data: User) => void;
// }) => {
//   const { logout } = useLogout();
//   const { authenticated } = usePrivy();

//   const { login } = useLogin({
//     onError(error) {
//       console.log('loginError', { loginError: error });
//     },
//     onComplete: console.log,
//     // axiosFetcher<User>('/api/users/upsert', {
//     //   withCredentials: true,
//     //   method: 'POST',
//     // }).then(onLogin),
//   });

//   return () =>
//     authenticated
//       ? logout()
//           .then(() => sleep(300))
//           .then(() => login())
//       : login();
// };
export const useLoginOrCreateUser = ({
  onLogin,
}: {
  onLogin?: (data: User) => void;
}) => {
  const queryClient = useQueryClient();
  const walletClient = useWalletClient();

  const { mutateAsync: login } = useMutation({
    mutationFn: async () => {
      if (!walletClient) return;

      // Create SIWE message
      const message = createSiweMessage({
        domain: window.location.host,
        address: walletClient?.account.address,
        statement: 'Sign in to Drip',
        uri: window.location.origin,
        version: '1',
        chainId: ChainId.BASE,
        nonce: generateSiweNonce(),
      });

      // Sign message
      const signature = await walletClient.signMessage({
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
        throw new Error(error.error || 'Login failed');
      }

      const user = await res.json();

      await queryClient.refetchQueries({ queryKey: [ACTIVE_USER_QUERY_KEY] });
      onLogin?.(user);
      return user;
    },
  });

  return login;
};
