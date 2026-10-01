// Gate for surfaces that exist only on a local machine.
//
// The flag lives in `.env.local`, which is gitignored and therefore never
// reaches the build on Vercel. Absence is the default, so forgetting to
// configure production is the safe outcome rather than the dangerous one.
//
// To enable locally:  echo 'NINECUPS_PRIVATE=1' >> .env.local

export function isPrivateEnabled(): boolean {
  return process.env.NINECUPS_PRIVATE === '1'
}
