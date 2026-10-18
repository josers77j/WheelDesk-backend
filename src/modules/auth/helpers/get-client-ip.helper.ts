import type { Request } from 'express';

const CLOUDFLARE_IP_HEADER = 'cf-connecting-ip';

export function getClientIp(
  req: Pick<Request, 'ip' | 'headers'>,
  trustCloudflare = process.env.TRUST_CLOUDFLARE_IP === 'true',
): string {
  if (trustCloudflare) {
    const cloudflareIp = req.headers[CLOUDFLARE_IP_HEADER];
    if (typeof cloudflareIp === 'string' && cloudflareIp.trim()) {
      return cloudflareIp.trim();
    }
  }

  return req.ip ?? '';
}
