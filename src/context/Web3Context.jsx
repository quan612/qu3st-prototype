import React, { useState, useEffect, useCallback } from 'react'
import { signIn, signOut } from 'next-auth/react'

// wallet-connect
// import EthereumProvider from '@walletconnect/ethereum-provider'
// import UniversalProvider from '@walletconnect/universal-provider'

import Enums from 'enums'

import { useWeb3CoreWalletContext } from './CoreWalletContext'
import { NoCoreWalletError } from '@avalabs/web3-react-core-connector'
// import { useWalletConnectContext } from './WalletConnectContext'

export const Web3Context = React.createContext()

export function Web3WalletProvider({ session, children }) {
  const [web3Error, setWeb3Error] = useState(null)

  const { coreWalletConnector } = useWeb3CoreWalletContext()

  // const { walletConnector, useIsActive, useAccount, useProvider } = useWalletConnectContext()

  // const walletConnectAccount = useAccount()
  // const walletConnectProvider = useProvider()

  // const isActive = useIsActive()
  // const coreWalletAccount = useAccount()
  // const coreWalletProvider = useProvider()

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

  const [activationError, setActivationError] = useState()

  const [signingCoreWallet, signingCoreWalletSet] = useState(false)

  // const walletConnectSign = async () => {
  //   alert(walletConnectAccount)
  //   if (walletConnectAccount) {
  //     const coreWalletSigner = walletConnectProvider?.getSigner()

  //     try {
  //       const signature = await walletConnectProvider
  //         .signMessage(`${Enums.USER_SIGN_MSG}`)
  //         .catch((err) => {
  //           throw new Error('User rejects signing.')
  //         })

  //       if (signature && walletConnectAccount) {
  //         signIn('web3-wallet', {
  //           redirect: true,
  //           signature,
  //           wallet: walletConnectAccount,
  //           callbackUrl: `${window.location.origin}`,
  //         }).catch((error) => {
  //           console.log(error.message)
  //         })
  //         signingCoreWalletSet(false)

  //         // clearTimeout(timeout)
  //         // resolve()
  //       }
  //       // clearTimeout(timeout)
  //       console.log('Missing address or signature')
  //     } catch (e) {
  //       // clearTimeout(timeout)
  //       console.log(e.message)
  //       signingCoreWalletSet(false)
  //     }
  //   }
  // }

  // useEffect(async () => {
  //   if (signingCoreWallet && walletConnectAccount) {
  //     const coreWalletSigner = walletConnectProvider?.getSigner()

  //     try {
  //       const signature = await walletConnectProvider
  //         .signMessage(`${Enums.USER_SIGN_MSG}`)
  //         .catch((err) => {
  //           throw new Error('User rejects signing.')
  //         })

  //       if (signature && walletConnectAccount) {
  //         signIn('web3-wallet', {
  //           redirect: true,
  //           signature,
  //           wallet: walletConnectAccount,
  //           callbackUrl: `${window.location.origin}`,
  //         }).catch((error) => {
  //           console.log(error.message)
  //         })
  //         signingCoreWalletSet(false)

  //         // clearTimeout(timeout)
  //         // resolve()
  //       }
  //       // clearTimeout(timeout)
  //       console.log('Missing address or signature')
  //     } catch (e) {
  //       // clearTimeout(timeout)
  //       console.log(e.message)
  //       signingCoreWalletSet(false)
  //     }
  //   }
  // }, [signingCoreWallet, walletConnectAccount])

  // useEffect(async () => {
  //   if (signingCoreWallet && coreWalletAccount) {
  //     const coreWalletSigner = coreWalletProvider?.getSigner()

  //     try {
  //       const signature = await coreWalletSigner
  //         .signMessage(`${Enums.USER_SIGN_MSG}`)
  //         .catch((err) => {
  //           throw new Error('User rejects signing.')
  //         })

  //       if (signature && coreWalletAccount) {
  //         signIn('web3-wallet', {
  //           redirect: true,
  //           signature,
  //           wallet: coreWalletAccount,
  //           callbackUrl: `${window.location.origin}`,
  //         }).catch((error) => {
  //           console.log(error.message)
  //         })
  //         signingCoreWalletSet(false)

  //         // clearTimeout(timeout)
  //         // resolve()
  //       }
  //       // clearTimeout(timeout)
  //       console.log('Missing address or signature')
  //     } catch (e) {
  //       // clearTimeout(timeout)
  //       console.log(e.message)
  //       signingCoreWalletSet(false)
  //     }
  //   }
  // }, [signingCoreWallet, coreWalletAccount])

  if (activationError instanceof NoCoreWalletError) {
    console.log('No Core Wallet Error')
  }

  // const signInWalletConnect = async () => {
  //   walletConnector.activate().catch((e) => {
  //     console.log(e)
  //     alert(e.message)
  //   })
  //   signingCoreWalletSet(true)
  // }

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
        console.log('test')
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

            if (signature && addresses[0]) {
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

  const nextAuthSignIn = ({ signature, address }) => {
    signIn('web3-wallet', {
      redirect: true,
      signature,
      wallet: address,
      callbackUrl: `${window.location.origin}`,
    }).catch((error) => {
      throw error
    })
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
  return (
    <Web3Context.Provider
      value={{
        signInWithWallet,
        // signInWalletConnect,
        signInCoreWallet,

        // walletConnectSign,
        SignOut,
        signUpWithWallet,
        unstoppableLogin,
        web3Error,
        setWeb3Error,
        session,
        nextAuthSignIn,
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
