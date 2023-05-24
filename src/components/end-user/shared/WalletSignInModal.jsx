import React, { useEffect, useState, useContext, useCallback } from 'react'
import { Heading, Text, Button, HStack, Progress } from '@chakra-ui/react'
import useDeviceDetect from '@hooks/useDeviceDetect'
import { MetamaskIcon, WalletConnectIcon } from '@components/shared/Icons'
import { Web3Context } from '@context/Web3Context'
import Enums from '@enums/index'

import ModalWrapper from '../wrappers/ModalWrapper'
import { useAccount, useConnect, useNetwork, useSignMessage } from 'wagmi'
import { signIn } from 'next-auth/react'
import useWalletConnect from '../../../hooks/useWalletConnect'
import { HeadingLg, HeadingSm } from '@components/shared/Typography'

const CONNECTABLE = 1
const AUTHENTICATING = 2
const AUTHENTICATED = 3
const ERROR = 4
const WALLETCONNECT = 5

const WalletSignInModal = ({ isOpen, onClose }) => {
  const { isMobile } = useDeviceDetect()
  const [signInError, errorSet] = useState()
  const {
    web3Error,
    signInWithWallet,
    setWeb3Error,
    // walletConnectSign,

    nextAuthSignIn,
  } = useContext(Web3Context)
  const [currentView, setView] = useState(CONNECTABLE)

  // const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
  const { handleOnConnect, handleOnSign } = useWalletConnect()

  const [isSigning, isSigningSet] = useState(false)

  async function handleConnect(type) {
    setView(AUTHENTICATING)
    try {
      if (type === Enums.WALLETCONNECT) {
        // connect({ connector: connectors[0] })
        handleOnConnect()
        // let res = await signInWalletConnect()
        setView(WALLETCONNECT)
      } else {
        let res = await signInWithWallet(type)
      }
      // setView(AUTHENTICATED)
    } catch (error) {
      alert(error.message)
      errorSet(error.message)
      setView(ERROR)
    }
  }

  // const handleOnSign = async () => {
  //   // await walletConnectSign()
  // }

  const handleOnClose = () => {
    errorSet(null)
    setWeb3Error(null)
    onClose()
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} handleOnClose={handleOnClose}>
      {currentView === CONNECTABLE && (
        <>
          <Heading color="white" fontSize={'xl'} align="center">
            Sign in with wallet
          </Heading>

          <Button
            variant="wallet"
            onClick={() => handleConnect(Enums.METAMASK)}
            minW="100%"
            borderRadius="24px"
          >
            <HStack>
              <MetamaskIcon />
              <Text>Metamask</Text>
            </HStack>
          </Button>

          <Button
            variant="twitter"
            onClick={() => handleConnect(Enums.WALLETCONNECT)}
            minW="100%"
            borderRadius="24px"
          >
            <HStack>
              <WalletConnectIcon />
              <Text>Wallet Connect</Text>
            </HStack>
          </Button>
        </>
      )}

      {currentView === AUTHENTICATING && <Progress size="xs" isIndeterminate w="80%" />}

      {(currentView === ERROR || web3Error) && (
        <>
          <Heading color="white" fontSize={'xl'} align="center">
            Error authenticating
          </Heading>
          {signInError && <Text color="red.300">{signInError}</Text>}
          {web3Error && <Text color="red.300">{web3Error}</Text>}

          <Button variant="blue" onClick={handleOnClose} minW="100%" borderRadius="24px" w="100%">
            Close
          </Button>
        </>
      )}

      {currentView === AUTHENTICATED && <Text>Redirecting...</Text>}
      {currentView === WALLETCONNECT && (
        <>
          <HeadingLg>Sign to validate</HeadingLg>
          <Button
            variant="blue"
            onClick={async () => {
              const { address, signature } = await handleOnSign()

              nextAuthSignIn({ address, signature })
            }}
            minW="100%"
            borderRadius="24px"
            w="100%"
          >
            Sign
          </Button>
        </>
      )}
    </ModalWrapper>
  )
}

export default WalletSignInModal
