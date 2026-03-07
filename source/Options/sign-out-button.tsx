import {useSignOut} from '../queries/use-gmail-auth';

export const SignOutButton = () => {
  const signOut = useSignOut();

  return (
    <button type="button" onClick={() => signOut.trigger()}>
      Sign Out
    </button>
  );
};
