#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const semver = require('semver');

const argv = process.argv.slice(2);
const typeScriptVersion = argv[0] || '';
if (!typeScriptVersion) {
  console.error('Please specify TypeScript version as the first parameter');
  process.exit(1);
}

const setupPattern = new RegExp(argv[1] || '', 'ig');

exec('yarn workspaces --json info', (error, stdout) => {
  if (error) {
    throw error;
  }

  const yarnOutput = JSON.parse(stdout);
  const workspacesByName = JSON.parse(yarnOutput.data);
  const workspaceNames = Object.keys(workspacesByName);

  const matchingWorkspaces = workspaceNames.flatMap((workspaceName) => {
    if (!setupPattern.test(workspaceName)) {
      console.warn(`Excluding setup ${workspaceName}`);
      return [];
    }

    const workspace = workspacesByName[workspaceName];
    const packageJsonContents = fs.readFileSync(`./${workspace.location}/package.json`, 'utf8');
    const packageJson = JSON.parse(packageJsonContents);

    const workspaceTypeScriptVersion = packageJson.peerDependencies
      ? packageJson.peerDependencies.typescript
      : undefined;
    if (!workspaceTypeScriptVersion) {
      throw new Error(
        `Test setup ${workspaceName} does not specify compatible typescript versions in peerDependencies!`,
      );
    }

    const typeScriptVersionMatchesWorkspace = semver.satisfies(typeScriptVersion, workspaceTypeScriptVersion);

    return typeScriptVersionMatchesWorkspace ? [workspaceName] : [];
  });

  process.stdout.write(matchingWorkspaces.join('\n'));
  process.stdout.write('\n');
});
