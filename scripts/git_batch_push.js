const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const token = process.argv[2];
const repoUrl = 'https://github.com/canocanokorea-collab/canocano.git';

if (!token) {
  console.error('Error: Token required');
  process.exit(1);
}

const onAuth = () => ({ username: token.trim() });

async function pushBranch() {
  console.log('Pushing to GitHub...');
  await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    url: repoUrl,
    ref: 'main',
    force: true,
    onAuth,
  });
  console.log('Push successful!');
}

async function commitFiles(filepaths, message) {
  for (const fp of filepaths) {
    await git.add({ fs, dir, filepath: fp });
  }
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'canocanokorea-collab',
      email: 'canocanokorea@gmail.com',
    },
    message,
  });
  console.log(`Committed (${message}): ${sha.slice(0, 7)} with ${filepaths.length} files`);
}

async function main() {
  console.log('1. Initializing Git repository...');
  await git.init({ fs, dir, defaultBranch: 'main' });

  // Scan all files
  const matrix = await git.statusMatrix({ fs, dir });
  const allFiles = matrix.filter(([_, head, workdir]) => workdir !== 0).map(([fp]) => fp);

  // Group 1: Source code, configs, functions, documentation (no images)
  const coreFiles = allFiles.filter(fp => !fp.startsWith('public/images/'));
  console.log(`Found ${coreFiles.length} core source code files.`);

  await commitFiles(coreFiles, 'feat: Core application source code and configuration');
  await pushBranch();

  // Group 2: General brand images (about, hero, logo)
  const generalImages = allFiles.filter(fp => fp.startsWith('public/images/') && !fp.startsWith('public/images/products/'));
  if (generalImages.length > 0) {
    console.log(`Found ${generalImages.length} general brand image files.`);
    await commitFiles(generalImages, 'feat: Add brand logos and general images');
    await pushBranch();
  }

  // Group 3: Product images in batches of 40 files
  const productImages = allFiles.filter(fp => fp.startsWith('public/images/products/'));
  console.log(`Found ${productImages.length} product images to push in batches.`);

  const batchSize = 40;
  for (let i = 0; i < productImages.length; i += batchSize) {
    const batch = productImages.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(productImages.length / batchSize);
    console.log(`Processing product images batch ${batchNum}/${totalBatches} (${batch.length} files)...`);
    await commitFiles(batch, `feat: Add product images batch ${batchNum}/${totalBatches}`);
    await pushBranch();
  }

  console.log('🎉 All files have been successfully pushed to GitHub!');
}

main().catch(err => {
  console.error('Fatal batch push error:', err);
  process.exit(1);
});
