import { ImportLookupCache } from './import-lookup-cache';

describe('ImportLookupCache', () => {
  it('reuses successful lookups and separates keys', async () => {
    const cache = new ImportLookupCache<number>();
    const load = jest.fn().mockResolvedValue(7);
    expect(await cache.getOrLoad('unit:59', load)).toBe(7);
    expect(await cache.getOrLoad('unit:59', load)).toBe(7);
    expect(load).toHaveBeenCalledTimes(1);
    await cache.getOrLoad('item:59', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('drops values on reset or rollback', async () => {
    const cache = new ImportLookupCache<number>();
    const load = jest.fn().mockResolvedValueOnce(7).mockResolvedValueOnce(8);
    await cache.getOrLoad('unit:59', load);
    cache.clear();
    expect(await cache.getOrLoad('unit:59', load)).toBe(8);
  });

  it('does not cache missing or rejected lookups', async () => {
    const cache = new ImportLookupCache<number>();
    const load = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValueOnce(9);
    expect(await cache.getOrLoad('unit:59', load)).toBeNull();
    await expect(cache.getOrLoad('unit:59', load)).rejects.toThrow('failure');
    expect(await cache.getOrLoad('unit:59', load)).toBe(9);
    expect(load).toHaveBeenCalledTimes(3);
  });
});
