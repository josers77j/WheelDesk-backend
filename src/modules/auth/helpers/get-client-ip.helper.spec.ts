import type { Request } from 'express';
import { getClientIp } from './get-client-ip.helper';

describe('getClientIp', () => {
  const request = (ip: string, headers: Record<string, string>) =>
    ({ ip, headers }) as unknown as Request;

  it('uses the Cloudflare address when explicitly enabled', () => {
    expect(
      getClientIp(
        request('10.0.0.2', { 'cf-connecting-ip': '198.51.100.10' }),
        true,
      ),
    ).toBe('198.51.100.10');
  });

  it('uses the request IP outside Cloudflare mode', () => {
    expect(
      getClientIp(
        request('192.168.1.15', { 'cf-connecting-ip': '198.51.100.10' }),
        false,
      ),
    ).toBe('192.168.1.15');
  });

  it('falls back to the request IP when the Cloudflare header is missing', () => {
    expect(getClientIp(request('127.0.0.1', {}), true)).toBe('127.0.0.1');
  });
});
