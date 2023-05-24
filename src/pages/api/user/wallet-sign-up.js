import { utils } from 'ethers'
import { prisma } from '@context/PrismaContext'
import Enums from '@enums/index'
import { recoverPersonalSignature } from '@metamask/eth-sig-util'
import { bufferToHex } from 'ethereumjs-util'
import { getQuestByTypeId, getQuestType } from 'repositories/quest'
import { updateUserWalletTransaction } from 'repositories/transactions'
import { isWhiteListUser } from 'repositories/session-auth'
import { signUpRateLimit } from '@middlewares/applyRateLimit'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function walletSignUp(req, res) {
  const { method } = req

  switch (method) {
    case 'POST':
      try {
        await signUpRateLimit(req, res)
        const { address, signature } = req.body
        const session = await getServerSession(req, res, authOptions)
        const whiteListUser = await isWhiteListUser(session)

        if (!signature || !address) {
          return res.status(200).json({
            isError: true,
            message: 'Missing user info for wallet linking.',
          })
        }

        const walletAuthQuestType = await getQuestType(Enums.WALLET_AUTH)
        if (!walletAuthQuestType) {
          const error = 'Cannot find quest type Wallet Auth. Missing Quest Type config.'
          return res.status(200).json({
            isError: true,
            message: error,
          })
        }

        const walletAuthQuest = await getQuestByTypeId(walletAuthQuestType.id)
        if (!walletAuthQuest) {
          const error = 'Cannot find quest associated with Wallet Auth yet.'
          return res.status(200).json({
            isError: true,
            message: error,
          })
        }

        const wallet = utils.getAddress(address)
        const isValid = utils.isAddress(address)
        if (!wallet || !isValid) {
          return res.status(200).json({
            isError: true,
            message: 'The wallet address is not valid.',
          })
        }

        const msg = `${Enums.USER_SIGN_MSG}`
        const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'))

        const originalAddress = recoverPersonalSignature({
          data: msgBufferHex,
          signature: signature.trim(),
        })
        if (originalAddress.toLowerCase() !== address.toLowerCase())
          return res.status(200).json({ isError: true, message: 'Invalid signature.' })

        const existingUser = await prisma.whiteList.findUnique({
          where: { wallet },
        })

        if (existingUser && existingUser?.userId !== whiteListUser?.userId) {
          return res.status(200).json({
            isError: true,
            message: 'Attempt with existed wallet belong to other user.',
          })
        }

        await updateUserWalletTransaction(walletAuthQuest.questId, whiteListUser?.userId, wallet)

        return res.status(200).json({ message: 'Link wallet successfully.' })
      } catch (error) {
        console.log(error)
        res.status(200).json({ isError: true, message: error.message })
      }
      break
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

const trackRequest = async (req) => {
  const { url, headers } = req

  const referer = headers['referer']
  const userAgent = headers['user-agent']
  const wallet = utils.getAddress(req.body.address)
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress

  await prisma.logRegister.create({
    data: {
      url,
      referer,
      userAgent,
      wallet,
      ip,
    },
  })
}

const blockedUserAgentArr = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
]

const blockIPArr = ['103.152.220.44']

const checkRequest = async (req, res) => {
  console.log(`**Check Request**`)
  const { url, headers } = req

  const forwarded = req.headers['x-forwarded-for']
  const userAgent = headers['user-agent']

  const ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress

  if (blockIPArr.includes(ip)) {
    let message = 'Ip black list'
    console.log(message)
    return message
  }
  let sameRequest = await prisma.logRegister.findMany({
    where: {
      ip,
    },
  })
  if (sameRequest.length > 2) {
    let message = 'Found same request from same location'
    console.log(message)
    return message
  }
  return ''
}
