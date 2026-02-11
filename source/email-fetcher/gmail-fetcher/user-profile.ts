export type UserProfile = {
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export async function getUserProfile(
  accessToken: string
): Promise<UserProfile> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v1/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.json();
}
