import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ReaderExperience } from '../features/reader/ReaderExperience';

export function ReaderPage() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = slug ? `Lanobe Reader - ${slug}` : 'Lanobe Reader';
    return () => {
      document.title = previousTitle;
    };
  }, [slug]);

  return (
    <div className="relative">
      <Link
        to="/lanobe/bookshelf"
        className="absolute left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-950/75 px-4 py-2 text-sm font-semibold text-stone-100 backdrop-blur-md hover:border-stone-500"
      >
        <ArrowLeft size={16} />
        Back To Bookshelf
      </Link>
      <ReaderExperience />
    </div>
  );
}
