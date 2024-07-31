import { ArrowLeft } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { Headline } from './typography';

export const PageHeader = ({ title }: { title?: string }) => {
  const router = useRouter();
  return (
    <div className="flex items-center justify-evenly py-4 px-6">
      <button onClick={() => router.back()} className="w-full">
        <ArrowLeft height={24} width={24} strokeWidth={2.4} />
      </button>
      <Headline className="w-full text-center">{title}</Headline>
      <div className="w-full" />
    </div>
  );
};
