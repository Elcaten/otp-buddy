import {describe, test, expect, vi, beforeEach} from 'vitest';
import {getUserProfile} from './user-profile';

describe('getUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls the Google userinfo endpoint with bearer token', async () => {
    const mockProfile = {
      email: 'user@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    };
    const mockFetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockProfile),
    });
    vi.stubGlobal('fetch', mockFetch);

    await getUserProfile('test-access-token');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {headers: {Authorization: 'Bearer test-access-token'}}
    );
  });

  test('returns parsed profile object', async () => {
    const mockProfile = {
      email: 'user@example.com',
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockProfile),
    }));

    const result = await getUserProfile('my-token');

    expect(result).toEqual(mockProfile);
  });

  test('includes only email when optional fields are absent', async () => {
    const mockProfile = {email: 'minimal@example.com'};
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockProfile),
    }));

    const result = await getUserProfile('token');

    expect(result.email).toBe('minimal@example.com');
    expect(result.name).toBeUndefined();
  });
});
