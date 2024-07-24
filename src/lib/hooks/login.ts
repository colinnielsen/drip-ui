import { useLogin } from '@privy-io/react-auth';
import { axiosFetcher } from '../utils';

export const useLoginOrCreateUser = ({ onLogin }: { onLogin?: () => void }) => {
  const { login } = useLogin({
    onOAuthLoginComplete: () => {
      console.log('onOAuthLoginComplete');
    },
    onError(error) {
      console.log('loginError', { loginError: error });
    },
    onComplete: () => {
      return axiosFetcher('/api/users/upsert', {
        withCredentials: true,
        method: 'POST',
      }).then(onLogin);
    },
  });

  return login;
};
