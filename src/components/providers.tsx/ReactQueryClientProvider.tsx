import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export const ReactQueryClientProvider = ({
  children,
  useDevTools = false,
}: {
  children: React.ReactNode;
  useDevTools?: boolean;
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {useDevTools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
