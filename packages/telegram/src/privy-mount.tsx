import { createRoot } from "react-dom/client";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect } from "react";
import { base, baseSepolia, mainnet, arbitrum, bsc } from "viem/chains";
import type { Connected } from "./wallet.js";

type EthereumProvider = Connected["provider"];

function Inner({
  onConnect,
}: {
  onConnect: (c: Connected) => void;
}) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    void (async () => {
      if (!ready || !authenticated) return;
      const w =
        wallets.find((x) => x.walletClientType === "privy") ?? wallets[0];
      if (!w) return;
      const provider = (await w.getEthereumProvider()) as EthereumProvider;
      onConnect({
        address: w.address as `0x${string}`,
        chainId: 8453,
        provider,
        source: "telegram",
      });
    })();
  }, [ready, authenticated, wallets, onConnect]);

  return null;
}

export function mountPrivy(
  el: HTMLElement,
  onConnect: (c: Connected) => void,
): { login: () => void } | null {
  const appId = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;
  if (!appId) return null;

  let loginFn: (() => void) | undefined;
  let pending = false;
  function Gate() {
    const { login, ready, authenticated } = usePrivy();
    useEffect(() => {
      loginFn = () => {
        void login({ loginMethods: ["telegram"] });
      };
      const inMiniApp = Boolean(globalThis.Telegram?.WebApp?.initData);
      if (pending || (ready && !authenticated && inMiniApp)) {
        pending = false;
        loginFn();
      }
    }, [login, ready, authenticated]);
    return <Inner onConnect={onConnect} />;
  }

  createRoot(el).render(
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["telegram"],
        appearance: { theme: "dark", walletChainType: "ethereum-only" },
        defaultChain: base,
        supportedChains: [base, baseSepolia, mainnet, arbitrum, bsc],
        embeddedWallets: {
          ethereum: { createOnLogin: "all-users" },
        },
      }}
    >
      <Gate />
    </PrivyProvider>,
  );

  return {
    login: () => {
      if (loginFn) loginFn();
      else pending = true;
    },
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string } };
  }
}
