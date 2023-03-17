import fs from 'node:fs/promises';
import path from 'node:path';
import {compileFunc} from '@ton-community/func-js';

(async (): Promise<void> => {
  const commonFiles = [
    {
      filename: 'stdlib.fc',
      content: await fs.readFile('./contracts/stdlib.fc', {encoding: 'utf-8'}),
    },
    {
      filename: 'params.fc',
      content: await fs.readFile('./contracts/params.fc', {encoding: 'utf-8'}),
    },
    {
      filename: 'op-codes.fc',
      content: await fs.readFile('./contracts/op-codes.fc', {encoding: 'utf-8'}),
    },
  ];

  const collectionCodeRes = await compileFunc({
    sources: [
      ...commonFiles,

      {
        filename: 'nft-collection.fc',
        content: await fs.readFile('./contracts/nft-collection.fc', {encoding: 'utf-8'}),
      },
    ],
  });

  const itemCodeRes = await compileFunc({
    sources: [
      ...commonFiles,

      {
        filename: 'nft-item.fc',
        content: await fs.readFile('./contracts/nft-item.fc', {encoding: 'utf-8'}),
      },
    ],
  });

  if (collectionCodeRes.status === 'error') {
    console.error(collectionCodeRes.message);
    process.exit(1);
  }

  if (itemCodeRes.status === 'error') {
    console.error(itemCodeRes.message);
    process.exit(1);
  }

  const distFolder = path.join(__dirname, './dist');

  await fs.writeFile(path.join(distFolder, 'nft-collection.boc'), collectionCodeRes.codeBoc, {
    encoding: 'base64',
  });
  await fs.writeFile(path.join(distFolder, 'nft-item.boc'), itemCodeRes.codeBoc, {
    encoding: 'base64',
  });
})();
