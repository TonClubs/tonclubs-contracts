import {
  Contract,
  ContractProvider,
  Sender,
  Address,
  Cell,
  contractAddress,
  beginCell,
  SendMode,
  BitString,
  BitBuilder,
} from 'ton-core';

const getBitStringFromUrl = (url: string): BitString => {
  const buffer = Buffer.from(new TextEncoder().encode(encodeURI(url)).buffer);
  return new BitString(buffer, 0, buffer.length * 8);
};

const getCollectionContentCell = (): Cell => {
  const collectionContentBuilder = new BitBuilder();
  collectionContentBuilder.writeUint(0x01, 8);
  collectionContentBuilder.writeBits(
    getBitStringFromUrl('https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/'),
  );

  return new Cell({bits: collectionContentBuilder.build()});
};

const getCommonContentCell = (): Cell => {
  const collectionContentBuilder = new BitBuilder();
  collectionContentBuilder.writeBits(
    getBitStringFromUrl('https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/'),
  );

  return new Cell({bits: collectionContentBuilder.build()});
};

export default class Counter implements Contract {
  public static createForDeploy(code: Cell, owner: Address, itemCode: Cell): Counter {
    const royaltyParams = beginCell()
      .storeUint(50, 16) // royalty factor
      .storeUint(1000, 16) // royalty base
      .storeAddress(owner) // royalty receiver
      .endCell();

    const contentCell = beginCell()
      .storeRef(getCollectionContentCell())
      .storeRef(getCommonContentCell())
      .endCell();

    const data = beginCell()
      .storeAddress(owner) // owner address
      .storeUint(0, 64) // next item index
      .storeUint(3, 64) // limit
      .storeUint(50000000, 64) // price -- 0.05 TON
      .storeRef(contentCell) // content cell
      .storeRef(itemCode) // code cell
      .storeRef(royaltyParams) // royalty params cell
      .endCell();

    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, {code, data});
    return new Counter(address, {code, data});
  }

  // eslint-disable-next-line no-useless-constructor
  public constructor(
    public readonly address: Address,
    public readonly init?: {code: Cell; data: Cell},
  ) {}

  // eslint-disable-next-line class-methods-use-this
  public async sendDeploy(provider: ContractProvider, via: Sender): Promise<void> {
    await provider.internal(via, {
      value: '0.01', // send 0.01 TON to contract for rent
      bounce: false,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public async sendMint(provider: ContractProvider, via: Sender, owner: Address): Promise<void> {
    const nftUriContentBuilder = new BitBuilder();
    nftUriContentBuilder.writeBits(getBitStringFromUrl('0'));

    const nftUriCell = new Cell({bits: nftUriContentBuilder.build()});

    const nftItemContentCell = beginCell().storeAddress(owner).storeRef(nftUriCell).endCell();

    const data = beginCell()
      .storeUint(1, 32) // op (op #1 = mint)
      .storeUint(0, 64) // query id
      .storeCoins(50000000)
      .storeRef(nftItemContentCell)
      .endCell();

    await provider.internal(via, {
      value: '0.12',
      body: data,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
    });
  }
}
