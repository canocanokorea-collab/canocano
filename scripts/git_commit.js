const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

const dir = process.cwd();

async function main() {
  console.log('Initializing git repository in', dir);
  await git.init({ fs, dir });

  console.log('Reading status matrix...');
  const statusMatrix = await git.statusMatrix({ fs, dir });

  const filesToAdd = [];
  for (const [filepath, head, workdir, stage] of statusMatrix) {
    if (workdir !== 0) {
      filesToAdd.push(filepath);
    }
  }

  console.log(`Found ${filesToAdd.length} files to stage.`);
  for (const filepath of filesToAdd) {
    await git.add({ fs, dir, filepath });
  }

  console.log('Committing changes...');
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'canocanokorea-collab',
      email: 'canocanokorea@gmail.com',
    },
    message: 'Initial commit: Complete CANO CANO Shopping Mall Project',
  });

  console.log('Commit created successfully! SHA:', sha);
}

main().catch(err => {
  console.error('Git error:', err);
  process.exit(1);
});
