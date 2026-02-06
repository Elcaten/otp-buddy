// @vitest-environment jsdom
import {GitlabEmailParser} from '../gitlab-email-parser';
import {expect, test, describe} from 'vitest';

import gitlabJson from '../../../../otpEmailSamples/gitlab-confirm-email.json';

describe('GitlabEmailParser', () => {
  test('should parse the Gitlab email', () => {
    const result = GitlabEmailParser.tryParse({
      id: '123',
      subject: 'Gitlab email',
      from: [{email: 'test@gitlab.com'}],
      content: gitlabJson.content,
    });
    expect(result).toMatchObject({success: true, result: '668454'});
  });
});
