import { createContext, useContext, useState, useEffect } from 'react'
import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { CoreWallet } from '@avalabs/web3-react-core-connector'

export const CoreWalletContext = createContext<
{
  coreWalletConnector: CoreWallet;
  error?: Error;
} & Web3ReactHooks
>({} as any);

export function CoreWalletProvider({ children }) {
  const [error, setError] = useState<Error | undefined>();
  const [connector, hooks] = initializeConnector(
    (actions) =>
      new CoreWallet({
        actions,
       
        onError: (e) => {
          console.error('Core Connector error', e)
          setError(e)
        },
      }),
  )

  const tryFetchAccount = async () => {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_accounts',
    })
    if(accounts.length > 0) {
      connector.connectEagerly()
    }
  }

  useEffect( () => {

    try {
      if ((window as any)?.ethereum) {
        tryFetchAccount()
      }
    } catch (error) {
      console.log(error.message)
    }
  }, [])

  return (
    <CoreWalletContext.Provider
      value={{
        coreWalletConnector: connector,
        error,
        ...hooks,
      }}
    >
      {children}
    </CoreWalletContext.Provider>
  )
}
export function useWeb3CoreWalletContext() {
  return useContext(CoreWalletContext);
}
