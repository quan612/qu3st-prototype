import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import {
  recoverPersonalSignature,
  recoverTypedSignature,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util'
import * as ethUtil from 'ethereumjs-util'
import { prisma } from '@context/PrismaContext'
import { utils } from 'ethers'
import Enums from 'enums'
import DiscordProvider from 'next-auth/providers/discord'
import TwitterProvider from 'next-auth/providers/twitter'
import { getConfig, getVariableConfig } from 'repositories/config'
import { validateEmail } from 'util/index'

const bcrypt = require('bcrypt')
const { NEXTAUTH_SECRET } = process.env

import { AccountStatus, QuestVariables } from '@prisma/client'
import { getIsSMSVerificationRequired } from 'repositories/user'
import verifyUathLogin from '@util/verifyUathLogin'
import { Authorization } from '@uauth/js'

// const allConfig: QuestVariables = await getConfig();

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: 'web3-wallet',
      name: 'web3-wallet',
      type: 'credentials',
      credentials: {
        wallet: {
          label: 'Walet',
          type: 'text',
        },
        signature: {
          label: 'Signature',
          type: 'text',
        },
      },
      authorize: async (credentials, req) => {
        const { wallet, signature } = credentials

        if (!wallet || !signature) throw new Error('Missing wallet or signature')

        if (utils.getAddress(wallet) && !utils.isAddress(wallet))
          throw new Error('Invalid wallet address')

        const msg = `${Enums.USER_SIGN_MSG}`

        const msgBufferHex = ethUtil.bufferToHex(Buffer.from(msg, 'utf8'))

        const originalAddress = recoverPersonalSignature({
          data: msgBufferHex,
          signature: signature.trim(),
        })

        if (originalAddress.toLowerCase() !== wallet.toLowerCase())
          throw new Error('Signature verification failed')

        return {
          wallet: originalAddress,
        } as any
      },
    }),
    CredentialsProvider({
      id: 'unstoppable-authenticate',
      name: 'Unstoppable authentication',
      type: 'credentials',
      credentials: {
        authorization: {
          label: 'Authorization',
          type: 'object',
        },
      },
      authorize: async (credentials, req) => {
        const { authorization } = credentials

        if (!authorization) {
          throw new Error('Missing auth')
        }

        const uathAuthorization: Authorization = JSON.parse(authorization)

        const isValid = await verifyUathLogin(
          authorization,
          process.env.NEXT_PUBLIC_UNSTOPPABLE_CLIENT_ID,
        )

        if (!isValid) {
          throw new Error('Invalid auth login')
        }

        const uathUser: string = uathAuthorization?.idToken?.sub

        return {
          uathUser,
        } as any
      },
    }),
    CredentialsProvider({
      id: 'email',
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'email',
      credentials: {
        email: {
          label: 'email',
          type: 'email',
          placeholder: 'jsmith@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const { email, password } = credentials

        // sanitize email field

        //check user and password
        if (!validateEmail(email)) {
          throw new Error('Invalid email.')
        }
        if (password.trim().length === 0) {
          throw new Error('Blank password.')
        }

        const currentUser = await prisma.whiteList.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
          },
        })

        if (!currentUser) {
          throw new Error('This email account is not found.')
        }

        // bcrypt check
        const comparePassword = await bcrypt.compare(password, currentUser.password)
        if (!comparePassword) {
          throw new Error('Wrong password entered.')
        }

        const isSMSVerificationRequired = await getIsSMSVerificationRequired()

        if (currentUser.status === AccountStatus.PENDING && isSMSVerificationRequired) {
          throw new Error(`Pending Sign Up`)
        }

        return {
          id: currentUser.id,
          userId: currentUser.userId,
          email: currentUser.email,
        } as any
      },
    }),
    DiscordProvider({
      /* default should be [origin]/api/auth/callback/[provider] ~ https://next-auth.js.org/configuration/providers/oauth */
      // clientId: allConfig?.discordId,//await getVariableConfig('discordId'),
      // clientSecret: allConfig?.discordSecret,//await getVariableConfig('discordSecret'),
      clientId: await getVariableConfig('discordId'),//,
      clientSecret: await getVariableConfig('discordSecret'),//,
    }),
    TwitterProvider({
      // clientId: allConfig?.twitterId,
      // clientSecret: allConfig?.twitterSecret,
      clientId: await getVariableConfig('twitterId'),//await getVariableConfig('twitterId'),
      clientSecret:await getVariableConfig('twitterSecret'),//await getVariableConfig('twitterSecret'),
      version: '2.0',
    }),
  ],
  debug: false,
  session: {
    strategy: 'jwt' as const,
    maxAge: 60 * 60 * 5,
  },
  jwt: {
    // signingKey: process.env.NEXTAUTH_SECRET || "",
    maxAge: 60 * 60 * 5,
  },
  callbacks: {
    signIn: async (user) => {
      const isSMSVerificationRequired = await getIsSMSVerificationRequired()
      if (user?.account?.provider === 'unstoppable-authenticate') {
        const uathUser = user?.credentials?.uathUser

        const existingUser = await prisma.whiteList.findFirst({
          where: {
            uathUser,
          },
        })
        if (!existingUser) {
          const error = `Unstoppable domain ${uathUser} is not linked to any account.`
          return `/quest-redirect?error=${error}`
        }

        return true
      }
      if (user?.account?.provider === 'email') {
        return true
      }
      /** Manual handling sign in check as we cannot do anything at authorize */
      if (user?.account?.provider === 'discord') {
        const discordId = user?.account?.providerAccountId
        const existingUser = await prisma.whiteList.findFirst({
          where: {
            discordId,
          },
        })
        if (!existingUser) {
          const error = `Discord ${user.profile.username}%23${user.profile.discriminator} not found in our database.`
          return `/quest-redirect?error=${error}`
        }
        if (existingUser.status === AccountStatus.PENDING && isSMSVerificationRequired) {
          return `/sms-verification?account=${discordId}&type=${Enums.DISCORD}`
        }
        return true
      }
      /** Manual handling sign in check as we cannot do anything at authorize */
      if (user?.account?.provider === 'twitter') {
        const twitterId = user?.account?.providerAccountId
        const existingUser = await prisma.whiteList.findFirst({
          where: {
            twitterId,
          },
        })
        if (!existingUser) {
          const error = `Twitter account ${user.user.name} not found.`
          return `/quest-redirect?error=${error}`
        }
        if (existingUser.status === AccountStatus.PENDING && isSMSVerificationRequired) {
          return `/sms-verification?account=${twitterId}&type=${Enums.TWITTER}`
        }
        return true
      }
      if (user?.account?.provider === 'web3-wallet') {
        const wallet = user.user.wallet
        const existingUser = await prisma.whiteList.findFirst({
          where: {
            wallet: { equals: wallet, mode: 'insensitive' },
          },
        })

        if (!existingUser) {
          const error = `Wallet account ${wallet} not found in our database.`
          return `/quest-redirect?error=${error}`
        }
        if (existingUser.status === AccountStatus.PENDING && isSMSVerificationRequired) {
          return `/sms-verification?account=${wallet}&type=${Enums.WALLET}`
        }

        return true
      }
      return false
    },
    async redirect({ url, baseUrl }) {
      return url
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        let userQuery

        if (account.provider === 'twitter') {
          userQuery = await prisma.whiteList.findFirst({
            where: {
              twitterId: user?.id,
            },
          })
        }
        if (account.provider === 'discord') {
          userQuery = await prisma.whiteList.findFirst({
            where: {
              discordId: user?.id,
            },
          })
        }
        if (account.provider === 'web3-wallet') {
          userQuery = await prisma.whiteList.findFirst({
            where: {
              wallet: { equals: user?.wallet, mode: 'insensitive' },
            },
          })
        }
        if (account.provider === 'email') {
          userQuery = await prisma.whiteList.findFirst({
            where: {
              email: user?.email,
            },
          })
        }
        if (account.provider === 'unstoppable-authenticate') {
          userQuery = await prisma.whiteList.findFirst({
            where: {
              uathUser: user?.uathUser,
            },
          })
        }

        // token.profile = profile
        token.user = user

        token.provider = account?.provider

        token.user.twitter = userQuery?.twitterUserName || ''
        token.user.discord = userQuery?.discordUserDiscriminator || ''
        token.user.email = userQuery?.email || ''
        token.user.avatar = userQuery?.avatar || ''
        token.user.wallet = userQuery?.wallet || ''
        token.user.uathUser = userQuery?.uathUser || ''
        token.user.userId = userQuery.userId
      }

      return token
    },
    async session({ session, token }) {
      session.user = token.user
      session.provider = token.provider

      // console.log(session)
      return session
    },
  },
  secret: NEXTAUTH_SECRET,
}
// export default (req, res) => {

// export default function auth(req, res) {

  // export const a = 1;

export default (req, res) => {
  if (process.env.VERCEL) {
    // prefer NEXTAUTH_URL, fallback to x-forwarded-host
    req.headers['x-forwarded-host'] = process.env.NEXTAUTH_URL || req.headers['x-forwarded-host']
  }
  return  NextAuth(req, res, authOptions)
}
