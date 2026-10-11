const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

const dir = process.cwd();
const token = process.argv[2];

if (!token) {
  console.error('Usage: node scripts/git_push.js <GITHUB_TOKEN>');
  process.exit(1);
}

async function main() {
  console.log('Pushing to https://github.com/canocanokorea-collab/canocano.git on main branch...');
  
  // Set default branch to main
  try {
    await git.branch({ fs, dir, ref: 'main', checkout: true });
  } catch (e) {
    // Already on main or ref exists
  }

  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    url: 'https://github.com/canocanokorea-collab/canocano.git',
    ref: 'main',
    force: true,
    onAuth: () => ({
      username: token.trim(),
    }),
  });

  console.log('Push completed successfully!', pushResult);
}

main().catch(err => {
  console.error('Git push error:', err);
  process.exit(1);
});
