import { prisma } from '@context/PrismaContext'
import whitelistUserMiddleware from 'middlewares/whitelistUserMiddleware'

import { ContractType, Prisma, RedeemStatus } from '@prisma/client'
import { sleep } from '@util/index'
import Enums from '@enums/index'
import { ethers, utils } from 'ethers'
import redeemMiddleware from '@middlewares/redeemMiddleware'
import { getShopRequirementCost } from 'repositories/shop'
import { redeemShopRateLimit } from '@middlewares/applyRateLimit'

import { NextApiResponse } from 'next'
import { WhiteListApiRequest } from 'types/common'
import {
  getBlockExplorerLink,
  getContract,
  getProvider,
  getRedeemContract,
  getRedeemContractAddress,
  getSignerWallet,
  getTransactionOption,
} from '@util/blockchain/helpers'

const handler = async (req: WhiteListApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(200).json({
      isError: true,
      message: `Post only`,
    })
  }

  const { userId, wallet } = req.whiteListUser
  const { id: shopItemId } = req.body
  const shopItem = req.shopItem

  if (!wallet || wallet.length < 16 || !utils.getAddress(wallet)) {
    return res
      .status(200)
      .json({ message: 'Wallet account not linked or invalid wallet address', isError: true })
  }

  try {
    const { cost, rewardTypeId } = await getShopRequirementCost(shopItem.requirements)

    /* actual redeeming on-chain */
    const chain = shopItem?.chain
    const network = shopItem?.network

    const provider = getProvider(chain, network)
    const signerWallet = getSignerWallet(provider, chain, network)
    const redeemContractAddress = getRedeemContractAddress(chain, network)
    return res.status(200).json({
      isError: true,
      message: "assd",
    })
    // const redeemContract = getRedeemContract(signerWallet, redeemContractAddress)

    // const redeemContract = getRedeemContract(signerWallet, redeemContractAddress)
    // const options = await getTransactionOption(provider)

    // let slotToClaim
    // try {
    //   await prisma.$transaction(
    //     async (tx: any) => {
    //       // await tx.$executeRaw`select * from public."ShopItemRedeem" p where p."status"='AVAILABLE' and p."shopItemId"=${shopItemId} ORDER BY id ASC LIMIT 1 FOR UPDATE SKIP LOCKED;`
    //       // await sleep(500)
    //       const currentTime = new Date().toISOString().split('Z')[0].replace('T', ' ').toString()

    //       slotToClaim = await tx.$queryRaw`UPDATE "ShopItemRedeem" 
    //         SET "userId"=${userId}, "status"='PENDING', "updatedAt"=CAST(${currentTime} AS timestamp) 
    //         where "id" in 
    //         (select "id" from public."ShopItemRedeem" p where p."status" = 'AVAILABLE' and p."shopItemId"=${shopItemId} ORDER BY id ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
    //         RETURNING "id";
    //         ;`

    //       if (slotToClaim === 0 || slotToClaim?.length === 0) {
    //         throw new Error(`${shopItem.title} is redeemed all`)
    //       }

    //       if (cost > 0) {
    //         await tx.reward.update({
    //           where: {
    //             userId_rewardTypeId: { userId, rewardTypeId },
    //           },
    //           data: {
    //             quantity: {
    //               decrement: cost,
    //             },
    //           },
    //         })
    //       }
    //     },
    //     {
    //       maxWait: 10000,
    //       timeout: 30000,
    //     },
    //   )
    // } catch (error) {
    //   return res.status(200).json({
    //     isError: true,
    //     message: error.message,
    //   })
    // }

    // // console.log("slotToClaim", slotToClaim)
    // // const redeemedSlot = await prisma.shopItemRedeem.findFirst({
    // //   where: {
    // //     shopItemId,
    // //     redeemedBy: {
    // //       userId,
    // //     },
    // //     status: RedeemStatus.PENDING,
    // //   },
    // //   orderBy: {
    // //     updatedAt: 'desc',
    // //   },
    // // })

    // const contractAddress = shopItem?.contractAddress
    // const slotId = slotToClaim[0]?.id
    // console.log('slotId', slotId)

    // let tx

    // if (shopItem.contractType !== ContractType.ERC721 && shopItem.contractType !== ContractType.ERC20 && shopItem.contractType !== ContractType.ERC721A && shopItem.contractType !== ContractType.ERC1155) {
    //   return res.status(200).json({ message: 'Unsupported contract type' })
    // }
    try {
    //   if (shopItem.contractType === ContractType.ERC20) {
    //     const ercContract = getContract(signerWallet, contractAddress, shopItem?.abi)
    //     const decimal = await ercContract.decimals()
    //     const multiplier = shopItem.multiplier
    //     const parseDecimal = ethers.utils.parseUnits('1', decimal)
    //     const amount = parseDecimal.mul(multiplier)

    //     tx = await redeemContract.redeemERC20(contractAddress, wallet, amount, slotId, options)
    //   }
    //   if (shopItem.contractType === ContractType.ERC721) {
    //     tx = await redeemContract.redeemERC721(contractAddress, wallet, slotId, options)
    //   }
    //   if (shopItem.contractType === ContractType.ERC721A) {
    //     tx = await redeemContract.redeemERC721A(contractAddress, wallet, slotId, options)
    //   }
    //   if (shopItem.contractType === ContractType.ERC1155) {
    //     tx = await redeemContract.redeemERC1155(
    //       contractAddress,
    //       wallet,
    //       shopItem.tokenId,
    //       slotId,
    //       options,
    //     )
    //   }
    //   if (tx === null || !tx.hash) {
    //     throw new Error('Fail to submit transaction. Please contact support@qu3st.io')
    //   }

    //   await prisma.shopItemRedeem.update({
    //     where: {
    //       id: slotId,
    //     },
    //     data: {
    //       extendedRedeemData: {
    //         transactionHash: tx.hash,
    //       },
    //     },
    //   })

    //   const etherscanLink = getBlockExplorerLink(chain, network, tx.hash)
    //   return res.status(200).json({ message: etherscanLink })
    } catch (error) {
      if (cost > 0) {
        await revertRewardUpdate(userId, rewardTypeId, cost)
      }
      // await revertRedeemSlot(slotId)

      let errorMessage;

      if (error?.error?.reason) {
        console.log(error?.error?.reason)
        errorMessage = 'Fail to submit transaction. Please contact support@qu3st.io'
      } else {
        errorMessage = error.message
      }
      return res.status(200).json({
        isError: true,
        message: errorMessage,
      })
    }
  } catch (error) {
    // console.log(error?.error?.reason)
    let errorMessage

    if (error?.error?.reason) {
      console.log(error?.error?.reason)
      errorMessage = 'Fail to submit transaction. Please contact support@qu3st.io'
    } else {
      errorMessage = error.message
    }
    return res.status(200).json({
      isError: true,
      message: errorMessage,
    })
  }
}
export default whitelistUserMiddleware(redeemMiddleware(handler))

const revertRewardUpdate = async (userId, rewardTypeId, cost) => {
  await prisma.reward.update({
    where: {
      userId_rewardTypeId: { userId, rewardTypeId },
    },
    data: {
      quantity: {
        increment: cost,
      },
    },
  })
}

const revertRedeemSlot = async (slotId) => {
  await prisma.shopItemRedeem.update({
    where: {
      id: slotId,
    },
    data: {
      userId: null,
      status: RedeemStatus.AVAILABLE,
    },
  })
}
function parse(data) {
  return ethers.utils.parseUnits(Math.ceil(data) + '', 'gwei')
}
