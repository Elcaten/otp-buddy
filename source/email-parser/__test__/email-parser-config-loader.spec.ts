import {describe, expect, test, vi} from 'vitest';
import emailParserConfigJson from '../email-parser-config.json';
import {EmailParserConfigError, loadEmailParserConfig} from '../email-parser-config';

describe('loadEmailParserConfig', () => {
  const configUrl = 'https://config.example/email-parser-config.json';

  test('loads the bundled JSON lazily in development', async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      loadEmailParserConfig({
        isDevelopment: true,
        fetcher,
        localConfig: emailParserConfigJson,
      })
    ).resolves.toEqual(emailParserConfigJson);
    expect(fetcher).not.toHaveBeenCalled();
  });

  test('downloads and validates the JSON in production', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(emailParserConfigJson), {status: 200}));

    await expect(loadEmailParserConfig({isDevelopment: false, fetcher, configUrl})).resolves.toEqual(
      emailParserConfigJson
    );
    expect(fetcher).toHaveBeenCalledWith(configUrl, {
      cache: 'no-cache',
      credentials: 'omit',
    });
  });

  test('requires a configuration URL in production', async () => {
    await expect(loadEmailParserConfig({isDevelopment: false, configUrl: ''})).rejects.toThrow(
      'Email parser configuration URL is not configured.'
    );
  });

  test('rejects unsuccessful responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('Not found', {status: 404}));

    await expect(loadEmailParserConfig({isDevelopment: false, fetcher, configUrl})).rejects.toThrow(
      new EmailParserConfigError('Unable to download email parser rules (HTTP 404).')
    );
  });

  test('rejects invalid JSON', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{', {status: 200}));

    await expect(loadEmailParserConfig({isDevelopment: false, fetcher, configUrl})).rejects.toThrow(
      'Email parser rules contain invalid JSON.'
    );
  });

  test('rejects JSON that does not match the schema', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          rules: [{matchers: [], extractors: [{source: 'body', method: 'javascript', script: 'alert(1)'}]}],
        }),
        {status: 200}
      )
    );

    await expect(loadEmailParserConfig({isDevelopment: false, fetcher, configUrl})).rejects.toThrow(
      'Email parser rules do not match the required schema.'
    );
  });

  test('wraps network failures as parser configuration errors', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Network error'));

    await expect(loadEmailParserConfig({isDevelopment: false, fetcher, configUrl})).rejects.toBeInstanceOf(
      EmailParserConfigError
    );
  });

  test('wraps response download failures as parser configuration errors', async () => {
    const response = new Response('', {status: 200});
    vi.spyOn(response, 'text').mockRejectedValue(new TypeError('Connection interrupted'));
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response);

    await expect(loadEmailParserConfig({isDevelopment: false, fetcher, configUrl})).rejects.toBeInstanceOf(
      EmailParserConfigError
    );
  });
});
