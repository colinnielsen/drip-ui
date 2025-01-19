import drip from '@/assets/drip.jpg';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Body, Title1 } from '@/components/ui/typography';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();
  return (
    <PageWrapper className="text-center h-full flex items-center justify-center gap-2">
      <Title1>404</Title1>

      <Body>{router.asPath || 'This page'} was not found</Body>
      <div className="w-1/2 overflow-hidden">
        <Image src={drip} alt="drip favicon" className="-rotate-12" />
      </div>
    </PageWrapper>
  );
}
