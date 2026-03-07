import useSWR, {useSWRConfig} from 'swr';
import {getUserProfile} from '../email-fetcher/gmail-fetcher/user-profile';
import {tokenManager} from '../email-fetcher/gmail-fetcher/token-manager';
import {tokenStorage} from '../email-fetcher/gmail-fetcher/token-storage';
import useSWRMutation from 'swr/mutation';

export const useGmailProfile = () => {
  const userProfileQuery = useSWR(
    'gmailUserProfile',
    async () => {
      const storedToken = await tokenStorage.get();
      if (storedToken.type === 'not_found' || storedToken.type === 'expired') {
        return null;
      }
      let token: Awaited<ReturnType<typeof tokenManager.getAccessToken>>;
      try {
        token = await tokenManager.getAccessToken({interactive: false});
      } catch {
        return null;
      }
      const profile = await getUserProfile(token.access_token);
      return profile;
    },
    {suspense: true}
  );

  return userProfileQuery;
};

export const useSignIn = () => {
  const {mutate} = useSWRConfig();
  const signIn = useSWRMutation(
    'gmailSignIn',
    async () => {
      await tokenManager.getAccessToken({interactive: true});
    },
    {
      onSuccess: () => mutate('gmailUserProfile'),
    }
  );

  return signIn;
};

export const useSignOut = () => {
  const {mutate} = useSWRConfig();
  const signOut = useSWRMutation(
    'gmailSignOut',
    async () => {
      await tokenManager.revokeAccessToken();
    },
    {
      onSuccess: () => mutate('gmailUserProfile'),
    }
  );

  return signOut;
};
