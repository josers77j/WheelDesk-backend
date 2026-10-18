import { writeFileSync } from 'node:fs';

const sha = process.env.BUILD_GIT_SHA ?? 'local';
if (sha !== 'local' && !/^[a-f0-9]{40}$/.test(sha)) {
  throw new Error('BUILD_GIT_SHA must be a full Git commit identifier');
}
writeFileSync(
  'src/common/consts/build-version.const.ts',
  `// Generated during deployment packaging.\nexport const BUILD_GIT_SHA: string = '${sha}';\n`,
);
