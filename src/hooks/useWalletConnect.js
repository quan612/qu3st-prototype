
import { useAccount, useConnect, useNetwork, useSignMessage } from 'wagmi'
import Enums from '@enums/index'

const useWalletConnect = () => {
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
  const { signMessageAsync } = useSignMessage()
  const { chain } = useNetwork()
  const { address, isConnected } = useAccount()

  const handleOnConnect = () => {
    const walletConnectConnector = connectors.findIndex(c => c.id === 'walletConnect')
    connect({ connector: connectors[walletConnectConnector] })
  }

  const handleOnSign = async () => {
    try {

      // alert(address)
      console.log(address)

      const signature = await signMessageAsync({ message: `${Enums.USER_SIGN_MSG}` })
      // alert(signature)
      return { address, signature }

      // const message = new SiweMessage({
      //   domain: window.location.host,
      //   address: address,
      //   statement: 'Sign in with Ethereum to the app.',
      //   uri: window.location.origin,
      //   version: '1',
      //   chainId: chain?.id,
      //   nonce: await getCsrfToken(),
      // })

      // const signature = await signMessageAsync({ message: message.prepareMessage() })


    } catch (error) {
      alert(error.message)
      console.log(error)
    }
  }

  return {
    handleOnConnect,
    handleOnSign,
  }
}

export default useWalletConnect
