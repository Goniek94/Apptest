import { Suspense } from 'react';
import { MessagesPage } from '@/routes/MessagesPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MessagesPage />
    </Suspense>
  );
}
