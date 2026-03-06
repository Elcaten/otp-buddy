import {PropsWithChildren, Suspense} from 'react';
import {ErrorBoundary, FallbackProps as ErrorBoundaryFallbackProps} from 'react-error-boundary';
import useSWR from 'swr';
import {getUserProfile, UserProfile} from '../email-fetcher/gmail-fetcher/user-profile';
import {SignInWithGoogleButton} from './sign-in-with-google-button';
import {SignOutButton} from './sign-out-button';
import s from './gmail-options.module.scss';
import {tokenManager} from '../email-fetcher/gmail-fetcher/token-manager';

//#region GmailOptions layout

const GmailOptionsLayout = Object.assign(
  function ({children}: PropsWithChildren) {
    return <fieldset>{children}</fieldset>;
  },
  {
    Content: function Content({children}: PropsWithChildren) {
      return <div className={s.content}>{children}</div>;
    },
  }
);

//#endregion

//#region GmailOptions states

const GmailOptionsState = {
  Loading: () => (
    <GmailOptionsLayout>
      <GmailOptionsLayout.Content>
        <SignInWithGoogleButton disabled />
      </GmailOptionsLayout.Content>
    </GmailOptionsLayout>
  ),

  Error: (_props: ErrorBoundaryFallbackProps) => (
    <GmailOptionsLayout>
      <GmailOptionsLayout.Content>
        <SignInWithGoogleButton />
      </GmailOptionsLayout.Content>
    </GmailOptionsLayout>
  ),

  SignedIn: (props: {profile: UserProfile}) => (
    <GmailOptionsLayout>
      <GmailOptionsLayout.Content>
        <div className={s.profileInfo}>
          {!!props.profile.picture && (
            <div className={s.profileAvatar}>
              <img src={props.profile.picture} alt="User profile" />
            </div>
          )}
          <div>
            <div>{props.profile.name}</div>
            <div>{props.profile.email}</div>
          </div>
        </div>
        <SignOutButton />
      </GmailOptionsLayout.Content>
    </GmailOptionsLayout>
  ),
};

//#endregion

//#region Container

function GmailOptionsContainer() {
  const userProfileQuery = useSWR(
    'gmailUserProfile',
    async () => {
      const token = await tokenManager.getAccessToken({interactive: false});
      const profile = await getUserProfile(token.access_token);

      return profile;
    },
    {suspense: true}
  );

  return <GmailOptionsState.SignedIn profile={userProfileQuery.data} />;
}

//#endregion

//#region GmailOptions itself

export const GmailOptions = () => (
  <ErrorBoundary FallbackComponent={GmailOptionsState.Error}>
    <Suspense fallback={<GmailOptionsState.Loading />}>
      <GmailOptionsContainer />
    </Suspense>
  </ErrorBoundary>
);

//#endregion
