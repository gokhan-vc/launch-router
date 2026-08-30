export type WebApp = {
  ready: () => void;
  expand: () => void;
  enableClosingConfirmation?: () => void;
  colorScheme?: string;
  initData?: string;
  initDataUnsafe?: { user?: { id?: number; username?: string } };
  MainButton: {
    setText: (t: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (fn: () => void) => void;
    offClick: (fn: () => void) => void;
  };
  HapticFeedback?: { impactOccurred: (s: string) => void };
  showAlert?: (m: string) => void;
  openLink?: (url: string) => void;
};

export function webApp(): WebApp | null {
  const tg = (globalThis as { Telegram?: { WebApp?: WebApp } }).Telegram;
  return tg?.WebApp ?? null;
}

export function bootTelegram(): WebApp | null {
  const app = webApp();
  if (!app) return null;
  app.ready();
  app.expand();
  app.enableClosingConfirmation?.();
  return app;
}
