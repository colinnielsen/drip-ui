import { useLogin } from '@privy-io/react-auth';
import { axiosFetcher } from '../utils';
import { SavedUser } from '@/data-model/user/UserType';

export const useLoginOrCreateUser = ({
  onLogin,
}: {
  onLogin?: (data: SavedUser) => void;
}) => {
  const { login } = useLogin({
    onOAuthLoginComplete: () => {
      console.log('onOAuthLoginComplete');
    },
    onError(error) {
      console.log('loginError', { loginError: error });
    },
    onComplete: () => {
      return axiosFetcher<SavedUser>('/api/users/upsert', {
        withCredentials: true,
        method: 'POST',
      }).then(onLogin);
    },
  });

  return login;
};
