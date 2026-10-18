export function isProduction(environment = process.env.NODE_ENV): boolean {
  return environment?.trim().toLowerCase() === 'production';
}
