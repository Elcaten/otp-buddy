import {JSX} from 'react';
import {useQuery} from '../Popup/useQuery';
import {getUserProfile} from '../email-fetcher/gmail-fetcher/user-profile';
import {getAccessToken} from '../email-fetcher/gmail-fetcher/auth';
import {SignInWithGoogleButton} from './sign-in-with-google-button';
import {SignOutButton} from './sign-out-button';

export const GmailOptions = (): JSX.Element => {
  const userProfileQuery = useQuery({
    queryKey: 'gmailUserProfile',
    queryFn: async () =>
      getUserProfile((await getAccessToken({interactive: false})).access_token),
  });
  return (
    <div>
      {Boolean(userProfileQuery.loading) && (
        <div>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: 'magenta',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            J
            <div />
          </div>
          <div>John Dorian</div>
          <div>john@example.com</div>
        </div>
      )}

      {Boolean(userProfileQuery.error) && <SignInWithGoogleButton />}

      {!userProfileQuery.loading && !userProfileQuery.error && (
        <div>
          <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            {!!userProfileQuery.data?.picture && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                }}
              >
                <img src={userProfileQuery.data?.picture} alt="User profile" />
              </div>
            )}
            <div>
              <div>{userProfileQuery.data?.name}</div>
              <div>{userProfileQuery.data?.email}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      )}
    </div>
  );
};
