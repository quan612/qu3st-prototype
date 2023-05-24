import { prisma } from '@context/PrismaContext'
import whitelistUserMiddleware from 'middlewares/whitelistUserMiddleware'

import { sleep } from '@util/index'
import redeemMiddleware from '@middlewares/redeemMiddleware'
import { getShopRequirementCost, revertRedeemSlot, revertRewardUpdate } from 'repositories/shop'
import { NextApiResponse } from 'next'
import { WhiteListApiRequest } from 'types/common'
import { IntegrationType } from 'models/Integration-type'
import { WebhookSubscriber } from '@prisma/client'

const handler = async (req: WhiteListApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(200).json({
      isError: true,
      message: `Post only`,
    })
  }

  const { userId } = req.whiteListUser
  const { id: shopItemId } = req.body
  const shopItem = req.shopItem

  const { cost, rewardTypeId } = await getShopRequirementCost(shopItem.requirements)

  let slotToClaim
  try {
    await prisma.$transaction(
      async (tx: any) => {
        const currentTime = new Date().toISOString().split('Z')[0].replace('T', ' ').toString()

        slotToClaim = await tx.$queryRaw`UPDATE "ShopItemRedeem" 
            SET "userId"=${userId}, "status"='REDEEMED', "updatedAt"=CAST(${currentTime} AS timestamp) 
            where "id" in 
            (select "id" from public."ShopItemRedeem" p where p."status" = 'AVAILABLE' and p."shopItemId"=${shopItemId} ORDER BY id ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
            RETURNING "id";
            ;`

        if (slotToClaim === 0 || slotToClaim?.length === 0) {
          throw new Error(`${shopItem.title} is redeemed all`)
        }

        if (cost > 0) {
          await tx.reward.update({
            where: {
              userId_rewardTypeId: { userId, rewardTypeId },
            },
            data: {
              quantity: {
                decrement: cost,
              },
            },
          })
        }
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    )

    // move this to message queue
    // const webhookSubscribers = await prisma.webhookSubscriber.findMany({
    //   where: {
    //     type: IntegrationType.SHOP_ITEM,
    //   },
    // })

    // if (webhookSubscribers) {
    //   const webhooks: WebhookSubscriber[] = webhookSubscribers.filter(
    //     (r) => r.eventId === shopItem.id,
    //   )
    //   if (webhooks) {
    //     const currentWebhook = webhooks[0]
    //     const {url, description, type} = currentWebhook
    //     const payload = {
    //       description,
    //       webhookId: currentWebhook.id,
    //       type,
    //       eventName: shopItem.title,
    //       userId
    //     }

    //     try {
    //       await axios.post(url, payload)
    //     } catch (error) {
    //       console.log("we should handle this on a queue, with retry mechanism, not here")
    //     }

    //   }
    // }

    return res.status(200).json({
      message: `ok`,
    })
  } catch (error) {
    console.log(error.message)
    await revertRewardUpdate(userId, rewardTypeId, cost)
    const slotId = slotToClaim[0]?.id
    await revertRedeemSlot(slotId)

    return res.status(200).json({
      isError: true,
      message: "Fail to redeem. Please contact administrator.",
    })
  }
}
export default whitelistUserMiddleware(redeemMiddleware(handler))


