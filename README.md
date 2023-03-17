# TonClubs Contracts

Contracts used in the [TonClubs Bot](https://github.com/TonClubs/tonclubs-bot) (and web in the future).

## Deployment steps
- Fill in the .env file (DEPLOYED_NFT_CONTRACT_ADDRESS can be empty for the deploy)
- Install the dependencies (`yarn`)
- Change the action variable to `deploy` in the `src/index.ts` file.
- Run the deploy script (`yarn start`)

## Minting steps
- Follow the steps for [deployment](#deployment-steps)
- Change the DEPLOYED_NFT_CONTRACT_ADDRESS env variable
- Change the action variable to `mint`
- Run the mint script (`yarn start`)

## Compilation steps
- Install the dependencies (`yarn`)
- Run the compile script (`yarn compile`)
