import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  type Hex,
} from "viem";
import { base, baseSepolia, mainnet, arbitrum, bsc } from "viem/chains";
import { robinhood } from "@numetal/adapter-poolsfun";

export type Connected = {
  address: `0x${string}`;
  chainId: number;
  provider: EthereumProvider;
  source?: "injected" | "walletconnect" | "telegram";
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
  4663: robinhood,
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
  return {
    address,
    chainId: Number.parseInt(chainHex, 16),
    provider,
    source: "injected",
  };
}

export async function connectWalletConnect(): Promise<Connected> {
  const projectId = import.meta.env.VITE_WC_PROJECT_ID as string | undefined;
  if (!projectId) {
    throw new Error(
      "Set VITE_WC_PROJECT_ID (Reown Cloud) to connect wallets inside Telegram.",
    );
  }
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const provider = await EthereumProvider.init({
    projectId,
    showQrModal: true,
    optionalChains: [8453, 84532, 1, 42161, 56, 130, 4663],
    metadata: {
      name: "Numetal launch router",
      description: "Pick a pad. You sign.",
      url: globalThis.location?.origin ?? "https://numetal.xyz",
      icons: ["https://numetal.xyz/favicon.ico"],
    },
  });
  await provider.connect();
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
  const address = accounts[0] as `0x${string}`;
  if (!address) throw new Error("WalletConnect returned no account");
  return {
    address,
    chainId: Number.parseInt(chainHex, 16),
    provider: provider as unknown as EthereumProvider,
    source: "walletconnect",
  };
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
          blockExplorerUrls: chain.blockExplorers?.default?.url
            ? [chain.blockExplorers.default.url]
            : undefined,
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

/** Wallet broadcasts. Never sendRawTransaction through a public client. */
export async function sendWalletTransaction(
  provider: EthereumProvider,
  tx: {
    from: `0x${string}`;
    to: `0x${string}`;
    data: Hex;
    value?: Hex;
    chainId: number;
  },
): Promise<Hex> {
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value ?? "0x0",
        chainId: `0x${tx.chainId.toString(16)}`,
      },
    ],
  });
  return hash as Hex;
}
