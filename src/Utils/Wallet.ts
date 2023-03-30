import {TonClient, WalletContractV4, OpenedContract, Sender} from 'ton';
import {mnemonicToWalletKey} from 'ton-crypto';

export const getWallet = async (
  client: TonClient,
  mnemonic: string[],
): Promise<{
  wallet: WalletContractV4;
  walletContract: OpenedContract<WalletContractV4>;
  walletSender: Sender;
}> => {
  const key = await mnemonicToWalletKey(mnemonic);

  // open wallet v4
  const wallet = WalletContractV4.create({publicKey: key.publicKey, workchain: 0});
  if (!(await client.isContractDeployed(wallet.address))) {
    console.error('wallet is not deployed');
    process.exit(1);
  }

  // open wallet contract
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);

  return {wallet, walletContract, walletSender};
};
