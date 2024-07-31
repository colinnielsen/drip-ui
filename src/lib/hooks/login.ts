import { useLogin, useLogout } from '@privy-io/react-auth';
import { axiosFetcher, sleep } from '../utils';
import { SavedUser } from '@/data-model/user/UserType';

export const useLoginOrCreateUser = ({
  onLogin,
}: {
  onLogin?: (data: SavedUser) => void;
}) => {
  const { logout } = useLogout();

  const { login } = useLogin({
    onError(error) {
      console.log('loginError', { loginError: error });
    },
    onComplete: () =>
      axiosFetcher<SavedUser>('/api/users/upsert', {
        withCredentials: true,
        method: 'POST',
      }).then(onLogin),
  });

  return () =>
    logout()
      .then(() => sleep(1000))
      .then(() => login());
};
