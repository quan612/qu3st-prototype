import { ethers, utils } from 'ethers'
import { Chain, Network } from 'models/chain'

export const getProvider = (chain: string, network: string): ethers.providers.JsonRpcProvider => {
  let infuraNetwork

  if (chain === Chain.Ethereum && network === Network.EthereumMainnet) {
    infuraNetwork = 'homestead'
    return new ethers.providers.InfuraProvider(infuraNetwork, {
      projectId: process.env.NEXT_PUBLIC_INFURA_ID,
      projectSecret: process.env.INFURA_SECRET,
    })
  }

  if (chain === Chain.Ethereum && network === Network.EthereumGoerli) {
    infuraNetwork = 'goerli'
    return new ethers.providers.InfuraProvider(infuraNetwork, {
      projectId: process.env.NEXT_PUBLIC_INFURA_ID,
      projectSecret: process.env.INFURA_SECRET,
    })
  }

  if (chain === Chain.Polygon && network === Network.PolygonMainnet) {
    infuraNetwork = 'matic'
    return new ethers.providers.InfuraProvider(infuraNetwork, {
      projectId: process.env.NEXT_PUBLIC_INFURA_ID,
      projectSecret: process.env.INFURA_SECRET,
    })
  }

  if (chain === Chain.Polygon && network === Network.PolygonMumbai) {
    infuraNetwork = 'maticmum'
    return new ethers.providers.InfuraProvider(infuraNetwork, {
      projectId: process.env.NEXT_PUBLIC_INFURA_ID,
      projectSecret: process.env.INFURA_SECRET,
    })
  }

  if (chain === Chain.Arbitrum && network === Network.ArbitrumMainnet) {
    infuraNetwork = 'arbitrum'
    return new ethers.providers.InfuraProvider(infuraNetwork, {
      projectId: process.env.NEXT_PUBLIC_INFURA_ID,
      projectSecret: process.env.INFURA_SECRET,
    })
  }

  if (chain === Chain.Arbitrum && network === Network.ArbitrumGoerli) {
    infuraNetwork = 'arbitrum-goerli'
    return new ethers.providers.InfuraProvider(infuraNetwork, {
      projectId: process.env.NEXT_PUBLIC_INFURA_ID,
      projectSecret: process.env.INFURA_SECRET,
    })
  }

  if (chain === Chain.Avalance && network === Network.AvalanceMainnet) {
    return new ethers.providers.JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc')
  }

  if (chain === Chain.Avalance && network === Network.AvalanceFuji) {
    return new ethers.providers.JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc')
  }
  throw new Error('Unsupported chain or network on setting up provider')
}

export const getSignerWallet = (
  provider: ethers.providers.JsonRpcProvider,
  chain: string,
  network: string,
) => {
  if (chain === Chain.Ethereum && network === Network.EthereumMainnet) {
    return new ethers.Wallet(`0x${process.env.OPERATION_WALLET_PRIVATE_KEY}`, provider)
  }

  if (chain === Chain.Ethereum && network === Network.EthereumGoerli) {
    return new ethers.Wallet(`0x${process.env.OPERATION_WALLET_PRIVATE_KEY}`, provider)
  }

  if (chain === Chain.Polygon && network === Network.PolygonMainnet) {
    return new ethers.Wallet(`0x${process.env.OPERATION_WALLET_PRIVATE_KEY}`, provider)
  }

  if (chain === Chain.Polygon && network === Network.PolygonMumbai) {
    return new ethers.Wallet(`0x${process.env.OPERATION_WALLET_PRIVATE_KEY}`, provider)
  }

  if (chain === Chain.Arbitrum && network === Network.ArbitrumMainnet) {
    return new ethers.Wallet(`0x${process.env.OPERATION_WALLET_PRIVATE_KEY}`, provider)
  }

  if (chain === Chain.Arbitrum && network === Network.ArbitrumGoerli) {
    return new ethers.Wallet(`0x${process.env.OPERATION_WALLET_PRIVATE_KEY}`, provider)
  }

  if (chain === Chain.Avalance && network === Network.AvalanceMainnet) {
    return new ethers.Wallet(`0x${process.env.EXECUTOR_AVAX_MAINNET}`, provider)
  }

  if (chain === Chain.Avalance && network === Network.AvalanceFuji) {
    return new ethers.Wallet(`0x${process.env.EXECUTOR_AVAX_FUJI}`, provider)
  }

  throw new Error('Unsupported chain network on Get Signer Wallet')
}

export const getRedeemContractAddress = (chain, network) => {
  if (chain === Chain.Ethereum && network === Network.EthereumMainnet) {
    return process.env.REDEEM_ETHEREUM_MAINNET
  }

  if (chain === Chain.Ethereum && network === Network.EthereumGoerli) {
    return process.env.REDEEM_ETHEREUM_GOERLI
  }

  if (chain === Chain.Polygon && network === Network.PolygonMainnet) {
    return process.env.REDEEM_POLYGON_MAINNET
  }

  if (chain === Chain.Polygon && network === Network.PolygonMumbai) {
    return process.env.REDEEM_POLYGON_MUMBAI
  }

  if (chain === Chain.Arbitrum && network === Network.ArbitrumMainnet) {
    return process.env.REDEEM_ARBITRUM_MAINNET
  }

  if (chain === Chain.Arbitrum && network === Network.ArbitrumGoerli) {
    return process.env.REDEEM_ARBITRUM_GOERLI
  }

  if (chain === Chain.Avalance && network === Network.AvalanceMainnet) {
    return process.env.REDEEM_AVAX_MAINNET
  }

  if (chain === Chain.Avalance && network === Network.AvalanceFuji) {
    return process.env.REDEEM_AVAX_FUJI
  }

  throw new Error(`Unsupported chain or network on Getting Redeem Contract`)
}

export const getTransactionOption = async (provider) => {
  const feeData = await provider.getFeeData()
  return {
    gasPrice: feeData.gasPrice.mul(110).div(100),
  }
}

export const getContract = (signerWallet, contractAddress, contractAbi) => {
  return new ethers.Contract(utils.getAddress(contractAddress), contractAbi, signerWallet)
}

export const getBlockExplorerLink = (chain, network, transactionHash) => {
  if (chain === Chain.Ethereum && network === Network.EthereumMainnet) {
    return `https://etherscan.io/tx/${transactionHash}`
  }

  if (chain === Chain.Ethereum && network === Network.EthereumGoerli) {
    return `https://goerli.etherscan.io/tx/${transactionHash}`
  }

  if (chain === Chain.Polygon && network === Network.PolygonMainnet) {
    return `https://polygonscan.com/tx/${transactionHash}`
  }

  if (chain === Chain.Polygon && network === Network.PolygonMumbai) {
    return `https://mumbai.polygonscan.com/tx/${transactionHash}`
  }

  if (chain === Chain.Arbitrum && network === Network.ArbitrumMainnet) {
    return `https://arbiscan.io/tx/${transactionHash}`
  }

  if (chain === Chain.Arbitrum && network === Network.ArbitrumGoerli) {
    return `https://goerli.arbiscan.io/tx/${transactionHash}`
  }

  if (chain === Chain.Avalance && network === Network.AvalanceMainnet) {
    return `https://snowtrace.io/tx/${transactionHash}`
  }
  if (chain === Chain.Avalance && network === Network.AvalanceFuji) {
    return `https://testnet.snowtrace.io/tx/${transactionHash}`
  }

  throw new Error(`Unsupported chain or network on get block explorer`)
}

export const getRedeemContract = (signerWallet, redeemContractAddress) => {
  const redeemContractJson = require('./redeem-contract.json')

  return new ethers.Contract(
    utils.getAddress(redeemContractAddress),
    redeemContractJson,
    signerWallet,
  )
}