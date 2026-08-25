import { useEffect, useRef, useState, type JSX } from "react";
import { AppProvider, useApp } from "./AppContext";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
import ConfirmDialog from "./components/ConfirmDialog";
import TransactionModal from "./components/TransactionModal";
import LockScreen from "./components/LockScreen";
import HomePage from "./pages/HomePage";
import TransactionsPage from "./pages/TransactionsPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { startTutorial } from "./utils/tutorial";
import type { PageId } from "./types";

const VALID_PAGES: PageId[] = ["home", "transactions", "stats", "settings"];

function parseHash(hash: string): PageId | null {
  const cleaned = hash.replace(/^#\/?/, "").toLowerCase();
  if (cleaned === "") return "home";
  return VALID_PAGES.includes(cleaned as PageId) ? (cleaned as PageId) : null;
}

const PAGES: Record<PageId, () => JSX.Element> = {
  home: HomePage,
  transactions: TransactionsPage,
  stats: StatsPage,
  settings: SettingsPage,
};

function AppContent() {
  const {
    currentPage,
    navigateTo,
    txnModalOpen,
    locked,
    hasSeenTutorial,
    setHasSeenTutorial,
    pinHash,
    openTransactionModal,
    closeTransactionModal,
  } = useApp();
  const contentRef = useRef<HTMLElement>(null);
  const [notFound, setNotFound] = useState(false);
  const PageComponent = PAGES[currentPage];

  // Tutorial de bienvenida en la primera apertura (o al desbloquear)
  useEffect(() => {
    if (hasSeenTutorial || locked || pinHash) return;
    const timer = setTimeout(() => {
      setHasSeenTutorial(true);
      startTutorial(navigateTo, openTransactionModal, closeTransactionModal);
    }, 700);
    return () => clearTimeout(timer);
  }, [
    hasSeenTutorial,
    locked,
    pinHash,
    navigateTo,
    setHasSeenTutorial,
    openTransactionModal,
    closeTransactionModal,
  ]);

  // Sincroniza el hash con la página actual y maneja rutas desconocidas (404)
  useEffect(() => {
    const syncFromHash = () => {
      const page = parseHash(window.location.hash);
      if (page === null) {
        setNotFound(true);
        return;
      }
      setNotFound(false);
      if (page !== currentPage) navigateTo(page);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [currentPage, navigateTo]);

  // Scroll al tope al cambiar de página
  useEffect(() => {
    contentRef.current?.scrollTo({
      top: 0,
      behavior: document.body.classList.contains("driver-active") ? "auto" : "smooth",
    });
  }, [currentPage, notFound]);

  return (
    <div className="app-container">
      <div className="ambient-bg" aria-hidden="true" />
      <main className="content-area" ref={contentRef}>
        {notFound ? <NotFoundPage /> : <PageComponent />}
      </main>
      <BottomNav />
      {txnModalOpen && <TransactionModal />}
      <Toast />
      <ConfirmDialog />
      {locked && <LockScreen />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
