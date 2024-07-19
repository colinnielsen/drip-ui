import { useLogin } from '@privy-io/react-auth';
import { axiosFetcher } from '../utils';

export const useLoginOrCreateUser = ({ onLogin }: { onLogin?: () => void }) => {
  const { login } = useLogin({
    onComplete: () =>
      axiosFetcher('/api/users/upsert', {
        withCredentials: true,
        method: 'POST',
      }).then(onLogin),
  });

  return login;
};
