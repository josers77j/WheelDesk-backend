/** Successful lookups live only for the current sequential import batch. */
export class ImportLookupCache<Value> {
  private readonly values = new Map<string, Value>();

  getOrLoad(key: string, load: () => Promise<Value>): Promise<Value>;
  getOrLoad(
    key: string,
    load: () => Promise<Value | null>,
  ): Promise<Value | null>;
  async getOrLoad(
    key: string,
    load: () => Promise<Value | null>,
  ): Promise<Value | null> {
    const cached = this.values.get(key);
    if (cached !== undefined) return cached;
    const value = await load();
    if (value !== null) this.values.set(key, value);
    return value;
  }

  clear(): void {
    this.values.clear();
  }
}
