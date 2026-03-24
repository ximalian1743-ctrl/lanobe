import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LanobeLandingPage } from './pages/LanobeLandingPage';
import { BookshelfPage } from './pages/BookshelfPage';
import { ReaderPage } from './pages/ReaderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lanobe" element={<LanobeLandingPage />} />
        <Route path="/lanobe/bookshelf" element={<BookshelfPage />} />
        <Route path="/lanobe/book/:slug" element={<ReaderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
