import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { LanobeLandingPage } from './pages/LanobeLandingPage';
import { BookshelfPage } from './pages/BookshelfPage';
import { ReaderPage } from './pages/ReaderPage';
import { FreeReaderPage } from './pages/FreeReaderPage';
import { DriveModePage } from './pages/DriveModePage';
import { ToastProvider } from './components/Toast';
import { VersionBadge } from './components/VersionBadge';
import { useAppStore } from './store/useAppStore';

function ThemeApplier() {
  const theme = useAppStore((s) => s.settings.theme);
  useEffect(() => {
    const applied: 'dark' | 'light' | 'sepia' =
      theme === 'auto'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : (theme ?? 'dark');
    document.documentElement.dataset.theme = applied;

    if (theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    function onChange() {
      document.documentElement.dataset.theme = mq.matches ? 'light' : 'dark';
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <ThemeApplier />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lanobe" element={<LanobeLandingPage />} />
          <Route path="/lanobe/bookshelf" element={<BookshelfPage />} />
          <Route path="/lanobe/book/:slug" element={<ReaderPage />} />
          <Route path="/lanobe/drive/:slug" element={<DriveModePage />} />
          <Route path="/lanobe/reader" element={<FreeReaderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <VersionBadge />
    </ToastProvider>
  );
}
