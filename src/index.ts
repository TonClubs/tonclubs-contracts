import {getHttpEndpoint} from '@orbs-network/ton-access';
import {TonClient, Cell, Address} from 'ton';
import NFTCollection from './NFTCollection';
import {compile} from '../compile';
import {getWallet} from './Utils/Wallet';
import {waitUntil} from './Utils/Helpers';
import {MNEMONIC, argv} from './Utils/Constants';

(async (): Promise<void> => {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({network: 'testnet'});
  const client = new TonClient({endpoint});

  const {wallet, walletContract, walletSender} = await getWallet(client, MNEMONIC.split(' '));

  const seqno = await walletContract.getSeqno();

  if (argv.deploy === true) {
    const {collectionCode: collectionCodeStr, itemCode: itemCodeStr} = await compile();

    // prepare Collection's initial code and data cells for deployment
    const collectionCode = Cell.fromBoc(Buffer.from(collectionCodeStr, 'base64'))[0];
    const itemCode = Cell.fromBoc(Buffer.from(itemCodeStr, 'base64'))[0];
    const collection = NFTCollection.createForDeploy(collectionCode, wallet.address, itemCode);

    // exit if contract is already deployed
    console.log('contract address:', collection.address.toString());
    if (await client.isContractDeployed(collection.address)) {
      console.error('Collection already deployed');
      return;
    }

    const collectionContract = client.open(collection);

    // send the deploy transaction
    await collectionContract.sendDeploy(walletSender);
  }

  if (argv.mint === true) {
    const collectionAddress = Address.parse(process.env.DEPLOYED_NFT_CONTRACT_ADDRESS || '');
    const collection = new NFTCollection(collectionAddress);
    const collectionContract = client.open(collection);

    // Send the mint transaction
    await collectionContract.sendMint(walletSender, wallet.address);
  }

  console.log('waiting for transaction to confirm...');

  await waitUntil(async () => seqno !== (await walletContract.getSeqno()), 1500);

  console.log('transaction confirmed!');
})();
