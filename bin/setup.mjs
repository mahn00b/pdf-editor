import { ask } from './utils/prompt.mjs';
import { findPackageJsonFiles, replaceInFile } from './utils/fs-utils.mjs';

const workspace_question = ' Enter the workspace name:\n' +
    ' The workspace name will be use in generated node projects (i.e. @workspace_name = @workspace/package-name)\n' +
    ' We will also update existing projects to use the new workspace name.\n\n' +
    ' Please enter the workspace name:'

async function main() {
  const workspace_name = await ask(workspace_question);

  const files = findPackageJsonFiles(process.cwd());

  for (const file of files) {
    replaceInFile(file, '@repo', `@${workspace_name}`);
  }

  console.log(`Workspace name set to: ${workspace_name}`);
}

main();