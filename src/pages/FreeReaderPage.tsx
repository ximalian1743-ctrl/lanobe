import { ReaderExperience } from '../features/reader/ReaderExperience';

export function FreeReaderPage() {
  return (
    <ReaderExperience
      showHeader={false}
      returnTo="/lanobe/bookshelf"
      showEmptyUpload={true}
    />
  );
}
