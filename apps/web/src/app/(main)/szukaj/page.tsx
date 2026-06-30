import { Suspense } from 'react';
import { SearchPage } from '@/routes/SearchPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SearchPage />
    </Suspense>
  );
}
