# Token Y and Z: The Alpha Contract

This project demonstrates a smart-contract that manages two ERC-20 tokens, where one token is received and used to mint and distribute another token based on proportional contributions.

## Run Integration Tests

```shell
cd YZAlphaContracts
npm install
npx hardhat test
```

## Run Local Node

```shell
npx hardhat node
```

## Deployment

```shell
npx hardhat run scripts/deploy.ts --network localhost
```

## Users

This project includes named users. In the following CLI commands, replace `<user>` with `alice`, `bob`, or `owner`.

## Airdrop Y Tokens

```shell
npx hardhat airdrop-y --user <user> --amount <amount> --network localhost

npx hardhat y-balance --user <user> --network localhost
```

## Contribute Y Tokens

```shell
npx hardhat deposit-y --user <user> --amount <amount> --network localhost

npx hardhat alpha-contributions --network localhost
```

## Mint and Distribute Z Tokens

```shell
npx hardhat distribute-z --user owner --network localhost

npx hardhat z-balance --user <user> --network localhost
```
