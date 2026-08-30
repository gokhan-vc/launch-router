import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  type Hex,
} from "viem";
import { base, baseSepolia, mainnet, arbitrum, bsc } from "viem/chains";

export type Connected = {
  address: `0x${string}`;
  chainId: number;
  provider: EthereumProvider;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (ev: string, fn: (...a: unknown[]) => void) => void;
};

const CHAINS = {
  8453: base,
  84532: baseSepolia,
  1: mainnet,
  42161: arbitrum,
  56: bsc,
} as const;

function injected(): EthereumProvider | null {
  const eth = (globalThis as { ethereum?: EthereumProvider }).ethereum;
  return eth ?? null;
}

export async function connectInjected(): Promise<Connected> {
  const provider = injected();
  if (!provider) {
    throw new Error(
      "No injected wallet. Inside Telegram, set VITE_WC_PROJECT_ID (WalletConnect) or VITE_PRIVY_APP_ID. On desktop, use MetaMask.",
    );
  }
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
  const address = accounts[0] as `0x${string}`;
  if (!address) throw new Error("wallet returned no account");
  return { address, chainId: Number.parseInt(chainHex, 16), provider };
}

export async function switchChain(
  provider: EthereumProvider,
  chainId: number,
): Promise<void> {
  const hexId = `0x${chainId.toString(16)}` as Hex;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexId }],
    });
  } catch (e) {
    const err = e as { code?: number };
    if (err.code !== 4902) throw e;
    const chain = CHAINS[chainId as keyof typeof CHAINS];
    if (!chain) throw e;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexId,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [...chain.rpcUrls.default.http],
        },
      ],
    });
  }
}

export function walletClient(c: Connected, chainId: number) {
  const chain = CHAINS[chainId as keyof typeof CHAINS] ?? base;
  return createWalletClient({
    account: c.address,
    chain,
    transport: custom(c.provider),
  });
}

export function publicClientFor(chainId: number) {
  const chain = CHAINS[chainId as keyof typeof CHAINS] ?? base;
  return createPublicClient({ chain, transport: http() });
}
