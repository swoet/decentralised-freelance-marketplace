export type WalletConnection = {
  address: string
  chainId: number
}

export async function connectWallet(): Promise<WalletConnection | null> {
  const eth = (globalThis as any).ethereum
  if (!eth || !eth.request) return null
  const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
  const chainIdHex: string = await eth.request({ method: 'eth_chainId' })
  const chainId = parseInt(chainIdHex, 16)
  return { address: accounts[0], chainId }
}

export async function switchChain(chainId: number) {
  const eth = (globalThis as any).ethereum
  if (!eth || !eth.request) return false
  const hex = '0x' + chainId.toString(16)
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] })
    return true
  } catch (e: any) {
    return false
  }
}
