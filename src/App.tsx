import { useState, useEffect, useRef } from "react";
import { AppProvider, useApp } from "./context";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
import ConfirmDialog from "./components/ConfirmDialog";
import HomePage from "./pages/HomePage";
import TransactionsPage from "./pages/TransactionsPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import type { PageId } from "./types";

function AppContent() {
  const { currentPage } = useApp();
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll al tope al cambiar de página
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const pages: Record<PageId, JSX.Element> = {
    home: <HomePage />,
    transactions: <TransactionsPage />,
    stats: <StatsPage />,
    profile: <ProfilePage />,
  };

  return (
    <div className="app-container">
      <div className="ambient-bg" />
      <div className="content-area" ref={contentRef}>
        {pages[currentPage]}
      </div>
      <BottomNav />
      <Toast />
      <ConfirmDialog />
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
