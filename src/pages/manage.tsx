import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageWrapper } from '@/components/ui/page-wrapper';
import { SquareConnectionManager } from '@/components/manage-page/square';
import { ClientOnly } from '@/components/ui/client-only';

export default function ManagePage() {
  return (
    <PageWrapper>
      <ClientOnly>
        <div className="flex flex-col items-center justify-center py-20 gap-6 px-10">
          <Tabs className="w-full" defaultValue="square">
            <TabsList>
              <TabsTrigger value="square">Square</TabsTrigger>
              <TabsTrigger value="slice">Slice</TabsTrigger>
            </TabsList>
            <TabsContent value="square">
              <SquareConnectionManager />
            </TabsContent>
          </Tabs>
        </div>
      </ClientOnly>
    </PageWrapper>
  );
}
