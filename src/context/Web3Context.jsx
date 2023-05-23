import React, { useState, useEffect, useCallback } from 'react'
import { signIn, signOut } from 'next-auth/react'

// wallet-connect
// import EthereumProvider from '@walletconnect/ethereum-provider'
// import UniversalProvider from '@walletconnect/universal-provider'

import Enums from 'enums'

import { useWeb3CoreWalletContext } from './CoreWalletContext'
import { NoCoreWalletError } from '@avalabs/web3-react-core-connector'

// import { Core } from '@walletconnect/core'
// import { Web3Wallet } from '@walletconnect/web3wallet'
import SignClient from '@walletconnect/sign-client'
// import Client from "@walletconnect/sign-client";

import { Web3Modal } from '@web3modal/standalone'

const web3Modal = new Web3Modal({
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID,
  walletConnectVersion: 2,
  standaloneChains: ['eip155:1'],
})

export const Web3Context = React.createContext()

import Client from '@walletconnect/sign-client'
import { UniversalProvider } from '@walletconnect/universal-provider'

export function Web3WalletProvider({ session, children }) {
  const [web3Error, setWeb3Error] = useState(null)

  const { coreWalletConnector, useIsActive, useAccount, useProvider } = useWeb3CoreWalletContext()
  const isActive = useIsActive()
  const coreWalletAccount = useAccount()
  const coreWalletProvider = useProvider()

  console.log('isActive', isActive)
  // console.log('coreWalletAccount', coreWalletAccount)
  let signMessageTimeout, adminSignTimeout

  useEffect(() => {
    removeLocalStorageWalletConnect()
    document.addEventListener('visibilitychange', function () {
      // if (window.visibilityState === "hidden") {
      localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE')
      //  }
    })

    return () => {
      if (signMessageTimeout) {
        clearTimeout(signMessageTimeout)
      }
      if (adminSignTimeout) clearTimeout(adminSignTimeout)
    }
  }, [])

  useEffect(async () => {
    if (session && window?.ethereum) {
      if (window?.ethereum) {
        subscribeProvider(window.ethereum)
      }
    }
  }, [session])

  const subscribeProvider = useCallback(async (provider) => {
    provider.on('error', (e) => console.error('WS Error', e))
    provider.on('end', (e) => console.error('WS End', e))

    provider.on('accountsChanged', async (accounts) => {
      SignOut()
    })

    provider.on('chainChanged', async (chainId) => {
      SignOut()
    })

    provider.on('connect', (info) => {
      console.log('connect')
    })

    provider.on('disconnect', async (error) => {
      SignOut()
    })
  }, [])

  const [activationError, setActivationError] = useState()

  const { signingCoreWallet, signingCoreWalletSet } = useState(false)

  useEffect(async () => {
    if (signingCoreWallet && coreWalletAccount) {
      const coreWalletSigner = coreWalletProvider?.getSigner()

      try {
        const signature = await coreWalletSigner
          .signMessage(`${Enums.USER_SIGN_MSG}`)
          .catch((err) => {
            throw new Error('User rejects signing.')
          })

        if (signature && coreWalletAccount) {
          signIn('web3-wallet', {
            redirect: true,
            signature,
            wallet: coreWalletAccount,
            callbackUrl: `${window.location.origin}`,
          }).catch((error) => {
            console.log(error.message)
          })
          signingCoreWalletSet(false)

          // clearTimeout(timeout)
          // resolve()
        }
        // clearTimeout(timeout)
        console.log('Missing address or signature')
      } catch (e) {
        // clearTimeout(timeout)
        console.log(e.message)
        signingCoreWalletSet(false)
      }
    }
  }, [signingCoreWallet, coreWalletAccount])

  if (activationError instanceof NoCoreWalletError) {
    console.log('No Core Wallet Error')
  }

  const signInCoreWallet = async () => {
    // if (!isActive) {
    coreWalletConnector.activate().catch((e) => {
      console.log(e)
    })
    signingCoreWalletSet(true)
    // }
    // if (coreWalletProvider && coreWalletAccount) {
    // const coreWalletSigner = coreWalletProvider?.getSigner()
    // console.log(coreWalletSigner)
    // const signature = await coreWalletSigner?.signMessage(`${Enums.USER_SIGN_MSG}`).catch((err) => {
    //   throw new Error('User rejects signing.')
    // })
    // }
    // const signer = coreWalletProvider?.getSigner()
    // const signature = await signer.signMessage(`${Enums.USER_SIGN_MSG}`).catch((err) => {
    //   throw new Error('User rejects signing.')
    // })
  }

  const [signClient, signClientSet] = useState()
  const [web3ModalSession, web3ModalSessionSet] = useState()

  const [ethereumProvider, setEthereumProvider] = useState()

  const onInitializeSignClient = async () => {
    let client
    try {
      client = await SignClient.init({
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      })
    } catch (error) {
      console.log(error)
    }

    console.log(client)

    signClientSet(client)
  }
  useEffect(() => {
    onInitializeSignClient()
  }, [])

  const walletConnectSign = async () => {
    try {
      // const message = `My email is john@doe.com - ${Date.now()}`;

      const account = web3ModalSession.namespaces.eip155.accounts[0].split(':')[2]
      // alert(`account ${account}`)
      let params = ['0xdeadbeaf', account]
      let method = 'personal_sign'

      const result = await signClient.request({
        topic: web3ModalSession.topic,
        chainId: 'eip155:1',
        request: {
          // id: 1,
          // jsonrpc: '2.0',
          method: method,
          params: params,
        },
      })

      alert(result)
    } catch (error) {
      alert(error.message)
    }
  }

  const signInWithWallet = async (walletType, payload = null) => {
    if (!walletType) {
      throw new Error('Missing wallet type.')
    }
    if (payload) {
      //automatic sign in without sign message
      let { signature, address } = payload
      await signIn('web3-wallet', {
        redirect: true,
        signature,
        wallet: address,
        callbackUrl: `${window.location.origin}`,
      }).catch((error) => {
        throw new Error(error.message)
      })
      return
    }
    try {
      let addresses, providerInstance
      const { ethers } = await import('ethers')

      if (walletType === Enums.METAMASK) {
        providerInstance = new ethers.providers.Web3Provider(window.ethereum)
        addresses = await providerInstance.send('eth_requestAccounts', [])
        subscribeProvider(window.ethereum)
      } else if (walletType === Enums.WALLETCONNECT) {
        //TODO HERE

        const client = await Client.init({
          logger: 'debug', // DEFAULT_LOGGER,
          relayUrl: 'wss://relay.walletconnect.com',
          projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID,
          // metadata: getAppMetadata() || DEFAULT_APP_METADATA,
        })

        const provider = await UniversalProvider.init({
          projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID,
          logger: 'debug',
          relayUrl: 'wss://relay.walletconnect.com',
        })

        // signClientSet(client)
        setEthereumProvider(provider)
        signClientSet(provider.client)

        // const core = new Core({
        //   projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID,
        // })
        // const web3wallet = await Web3Wallet.init({
        //   core, // <- pass the shared `core` instance
        //   metadata: {
        //     name: 'Demo app',
        //     description: 'Demo Client as Wallet/Peer',
        //     url: 'www.walletconnect.com',
        //     icons: [],
        //   },
        // })

        // await web3wallet.core.pairing.pair({ uri })
        // web3wallet.on('session_proposal', async (proposal) => {
        //   console.log(session_proposal)
        //   const session = await web3wallet.rejectSession({
        //     id: proposal.id,
        //     reason: getSdkError('USER_REJECTED_METHODS'),
        //   })
        // })
        // 2. Configure web3Modal
        // walletConnectV2
        // const a = await walletConnectV2.activate().catch((e) => console.log('error', e))
        // console.log(a)
        //testing
        try {
          // if (client) {
          //   // signClientSet(client)
          //   const namespaces = {
          //     eip155: {
          //       methods: ['personal_sign'],
          //       chains: ['eip155:1'],
          //       events: ['accountsChanged, connect, disconnect'],
          //     },
          //   }
          //   const { uri, approval } = await client.connect({
          //     requiredNamespaces: namespaces,
          //   })
          //   if (uri) {
          //     await web3Modal.openModal({
          //       uri,
          //       // standaloneChains: namespaces.eip155.chains,
          //     })
          //     // console.log('3')
          //     const sessionTemp = await approval()
          //     web3ModalSessionSet(sessionTemp)
          //     // console.log('4')
          //     // console.log('sessionTemp', sessionTemp)

          //     // console.log('accounts', accounts)

          //     client.pairing.getAll({ active: true })

          //     web3Modal.closeModal()

          //     return
          //   }
          // }
          if (!provider) {
            throw new ReferenceError('WalletConnect Client is not initialized.')
          }

          // const chainId = caipChainId.split(":").pop();

          // console.log("Enabling EthereumProvider for chainId: ", chainId);

          const pairings = provider.client.pairing.getAll({ active: true })
          const session = await provider.connect({
            namespaces: {
              eip155: {
                methods: [
                  // 'eth_sendTransaction',
                  // 'eth_signTransaction',
                  // 'eth_sign',
                  'personal_sign',
                  // 'eth_signTypedData',
                ],
                chains: [`eip155:1`],
                events: ['chainChanged', 'accountsChanged'],
                rpcMap: {},
              },
            },
            pairingTopic: pairings[0]?.topic, //pairing?.topic,
          })

          // createWeb3Provider(ethereumProvider)
          const _accounts = await ethereumProvider.enable()
          console.log('_accounts', _accounts)
        } catch (error) {
          alert('test1')
          alert(error.message)
        }

        // USE ETHEREUM PROVIDER HERE
        // const ethereumProvider = await UniversalProvider.init({
        //   projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID,
        //   logger: 'debug',
        //   relayUrl: 'wss://relay.walletconnect.com', //DEFAULT_RELAY_URL
        // })
        // const session = await ethereumProvider.connect({
        //   namespaces: {
        //     eip155: {
        //       methods: [
        //         'eth_sendTransaction',
        //         'eth_signTransaction',
        //         'eth_sign',
        //         'personal_sign',
        //         'eth_signTypedData',
        //       ],
        //       chains: ['eip155:80001'],
        //       events: ['chainChanged', 'accountsChanged'],
        //       rpcMap: {
        //         80001: `https://rpc.walletconnect.com?chainId=eip155:80001&projectId=${process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID}`,
        //       },
        //     },
        //   },
        //   // pairingTopic: pairing?.topic,
        // })
        // const _accounts = await ethereumProvider.enable()
        // const web3Provider = new ethers.providers.Web3Provider(provider)
        // const _accounts = await ethereumProvider.enable()
        // console.log('_accounts', _accounts)
        // const test = await EthereumProvider.init({
        //   projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECTID, // REQUIRED your projectId
        //   chains: [1], // REQUIRED chain ids
        //   showQrModal: false, // REQUIRED set to "true" to use @web3modal/standalone,
        //   // methods, // OPTIONAL ethereum methods
        //   // events, // OPTIONAL ethereum events
        //   // rpcMap, // OPTIONAL rpc urls for each chain
        //   // metadata, // OPTIONAL metadata of your app
        //   // qrModalOptions, // OPTIONAL - `undefined` by default, see https://docs.walletconnect.com/2.0/web3modal/options
        //   // qrcodeModalOptions: {
        //   //   mobileLinks: ['trust', 'metamask', 'coinbase', 'rainbow'],
        //   //   desktopLinks: ['encrypted ink'],
        //   // },
        // })
        // await test.connect({
        //   chains: [1], // OPTIONAL chain ids
        //   // rpcMap, // OPTIONAL rpc urls
        //   // pairingTopic, // OPTIONAL pairing topic
        // })
        // or
        // await provider.enable()
        // addresses = provider?.accounts
        // console.log(addresses)
        // const WalletConnectProvider = await import('@walletconnect/web3-provider')
        // const provider = new WalletConnectProvider({
        //   infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
        //   qrcodeModalOptions: {
        //     mobileLinks: ['trust', 'metamask', 'coinbase', 'rainbow'],
        //     desktopLinks: ['encrypted ink'],
        //   },
        // })
        // await provider.connect({
        //   // chains, // OPTIONAL chain ids
        //   // rpcMap, // OPTIONAL rpc urls
        //   // pairingTopic // OPTIONAL pairing topic
        // })
        // await provider.enable()
        // providerInstance = new ethers.providers.Web3Provider(provider)
        // addresses = provider?.accounts
        // subscribeProvider(provider)
      }

      if (addresses?.length === 0) {
        throw new Error('Account is locked, or is not connected, or is in pending request.')
      }
      const promise = new Promise((resolve, reject) => {
        let timeout = setTimeout(async function () {
          try {
            const signer = await providerInstance.getSigner()
            const signature = await signer.signMessage(`${Enums.USER_SIGN_MSG}`).catch((err) => {
              throw new Error('User rejects signing.')
            })

            if (signature && addresses[0] && signature) {
              signIn('web3-wallet', {
                redirect: true,
                signature,
                wallet: addresses[0],
                callbackUrl: `${window.location.origin}`,
              }).catch((error) => {
                reject(error.message)
              })
              clearTimeout(timeout)
              resolve()
            }
            clearTimeout(timeout)
            reject('Missing address or signature')
          } catch (e) {
            clearTimeout(timeout)
            reject(e)
          }
        }, 800)
      })

      return promise
    } catch (error) {
      if (error.message.indexOf('user rejected signing') !== -1) {
        throw new Error('User rejected signing')
      } else {
        console.log(error)
        // throw error
      }
    }
  }

  const signUpWithWallet = useCallback(async (walletType) => {
    if (!walletType) {
      throw new Error('Missing type of wallet when trying to setup wallet provider')
    }

    let addresses, providerInstance

    const { ethers } = await import('ethers')

    if (walletType === Enums.METAMASK) {
      providerInstance = new ethers.providers.Web3Provider(window.ethereum)
      addresses = await providerInstance.send('eth_requestAccounts', [])
    } else if (walletType === Enums.WALLETCONNECT) {
      // const WalletConnectProvider = await import('@walletconnect/web3-provider')
      // const provider = new WalletConnectProvider({
      //   infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
      //   qrcodeModalOptions: {
      //     mobileLinks: ['trust'],
      //     desktopLinks: ['encrypted ink'],
      //   },
      // })
      // await provider.enable()
      // providerInstance = new ethers.providers.Web3Provider(provider)
      // addresses = provider.accounts
    }

    if (addresses.length === 0) {
      setWeb3Error('Account is locked, or is not connected, or is in pending request.')
      return
    }

    const promise = new Promise((resolve, reject) => {
      let timeout = setTimeout(async function () {
        try {
          let signer, signature

          signer = await providerInstance.getSigner()

          signature = await signer.signMessage(`${Enums.USER_SIGN_MSG}`).catch((err) => {
            console.log(1)
            throw new Error('User rejects signing.')
          })

          if (signature && addresses[0]) {
            resolve({ signature, address: addresses[0] }) // if the previous line didn't always throw
            // clearTimeout(timeout);
          }
          reject('Missing address or signature')
        } catch (e) {
          reject(e)
        }
      }, 500)
    })

    return promise
  }, [])

  const SignOut = useCallback(async () => {
    removeLocalStorageWalletConnect()
    removeLocalStorageUath()
    signOut()
  }, [])

  const unstoppableLogin = useCallback(async (redirectUri) => {
    const UAuth = await import('@uauth/js')

    const uauth = new UAuth({
      clientID: process.env.NEXT_PUBLIC_UNSTOPPABLE_CLIENT_ID,
      redirectUri, //'https://www.riftly.xyz/user/sign-in',
      scope: 'openid wallet',
    })
    const authorization = await uauth.loginWithPopup()

    if (!authorization) {
      console.log('no auth')
      throw new Error('Missing authorization')
    }

    await signIn('unstoppable-authenticate', {
      redirect: false,
      authorization: JSON.stringify(authorization),
      callbackUrl: `${window.location.origin}`,
    })
  }, [])

  return (
    <Web3Context.Provider
      value={{
        signInWithWallet,
        signInCoreWallet,
        SignOut,
        signUpWithWallet,
        unstoppableLogin,
        web3Error,
        setWeb3Error,
        session,
        walletConnectSign,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

const removeLocalStorageWalletConnect = () => {
  const walletConnectCache = localStorage.getItem('walletconnect')
  if (walletConnectCache) {
    localStorage.removeItem('walletconnect')
  }
  const walletMobileCache = localStorage.getItem('WALLETCONNECT_DEEPLINK_CHOICE')
  if (walletMobileCache) {
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE')
  }
}

const removeLocalStorageUath = () => {
  const openidCache = localStorage.getItem('openidConfiguration:')
  if (openidCache) {
    localStorage.removeItem('openidConfiguration:')
  }
  const uathRequestCache = localStorage.getItem('request')
  if (uathRequestCache) {
    localStorage.removeItem('request')
  }
  const uathUserCache = localStorage.getItem('username')
  if (uathUserCache) {
    localStorage.removeItem('username')
  }
}
