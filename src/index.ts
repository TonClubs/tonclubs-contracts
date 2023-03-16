import * as fs from 'fs';
import {getHttpEndpoint} from '@orbs-network/ton-access';
import {mnemonicToWalletKey} from 'ton-crypto';
import {TonClient, Cell, WalletContractV4, Address} from 'ton';
import {compileFunc} from '@ton-community/func-js';
import NFTCollection from './NFTCollection';
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const ACTION: 'deploy' | 'mint' = 'mint' as any;

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const commonFiles = [
  {
    filename: 'stdlib.fc',
    content: fs.readFileSync('./contracts/stdlib.fc', {encoding: 'utf-8'}),
  },
  {
    filename: 'params.fc',
    content: fs.readFileSync('./contracts/params.fc', {encoding: 'utf-8'}),
  },
  {
    filename: 'op-codes.fc',
    content: fs.readFileSync('./contracts/op-codes.fc', {encoding: 'utf-8'}),
  },
];

(async () => {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({network: 'mainnet'});
  const client = new TonClient({endpoint});

  // open wallet v4 (notice the correct wallet version here)
  const mnemonic = process.env.MNEMONIC!;
  const key = await mnemonicToWalletKey(mnemonic.split(' '));
  const wallet = WalletContractV4.create({publicKey: key.publicKey, workchain: 0});
  if (!(await client.isContractDeployed(wallet.address))) {
    return console.log('wallet is not deployed');
  }

  // open wallet and read the current seqno of the wallet
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  if (ACTION === 'deploy') {
    const collectionCodeRes = await compileFunc({
      sources: [
        ...commonFiles,

        {
          filename: 'nft-collection.fc',
          content: fs.readFileSync('./contracts/nft-collection.fc', {encoding: 'utf-8'}),
        },
      ],
    });

    const itemCodeRes = await compileFunc({
      sources: [
        ...commonFiles,

        {
          filename: 'nft-item.fc',
          content: fs.readFileSync('./contracts/nft-item.fc', {encoding: 'utf-8'}),
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

    // prepare Collection's initial code and data cells for deployment
    const collectionCode = Cell.fromBoc(Buffer.from(collectionCodeRes.codeBoc, 'base64'))[0]; // compilation output from step 6
    const itemCode = Cell.fromBoc(Buffer.from(itemCodeRes.codeBoc, 'base64'))[0]; // compilation output from step 6
    const collection = NFTCollection.createForDeploy(collectionCode, wallet.address, itemCode);

    // exit if contract is already deployed
    console.log('contract address:', collection.address.toString());
    if (await client.isContractDeployed(collection.address)) {
      return console.log('Collection already deployed');
    }

    // send the deploy transaction
    const collectionContract = client.open(collection);

    await collectionContract.sendDeploy(walletSender);
  }

  if (ACTION === 'mint') {
    const collectionAddress = Address.parse(process.env.DEPLOYED_NFT_CONTRACT_ADDRESS!);
    const collection = new NFTCollection(collectionAddress);
    const collectionContract = client.open(collection);

    await collectionContract.sendMint(walletSender, wallet.address);
  }

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno === seqno) {
    console.log('waiting for transaction to confirm...');

    // eslint-disable-next-line no-await-in-loop
    await sleep(1500);

    // eslint-disable-next-line no-await-in-loop
    currentSeqno = await walletContract.getSeqno();
  }

  console.log('transaction confirmed!');

  return false;
})();
