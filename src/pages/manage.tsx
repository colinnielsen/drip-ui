import { CTAButton } from '@/components/ui/button';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { Body, Title2 } from '@/components/ui/typography';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { SQUARE_AUTHORIZATION_ERRORS } from './api/external/square-callback';

const AuthorizationResponses = () => {
  const searchParams = useSearchParams();
  const error = z
    .enum(SQUARE_AUTHORIZATION_ERRORS)
    .safeParse(searchParams.get('error'));

  if (!error.success) return null;

  const message = searchParams.get('message');

  return (
    <div className="flex flex-col gap-2">
      <Title2>{error.data}</Title2>
      <Body>{message}</Body>
    </div>
  );
};

export default function SellerPage() {
  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <AuthorizationResponses />

        <Title2>Connect Your Square Account</Title2>
        <Link href="/api/external/square-authorization-redirect">
          <CTAButton>Login</CTAButton>
        </Link>
      </div>
    </PageWrapper>
  );
}
