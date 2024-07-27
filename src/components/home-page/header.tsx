import { Input } from '@/components/ui/input';
import { useResetUser } from '@/queries/UserQuery';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { isDev } from '@/lib/utils';

export function Search() {
  const [search, setSearch] = useState<string>('');
  return (
    <div className="relative w-full h-8 items-center flex">
      <SearchIcon className="absolute left-3 h-4 w-4 pointer-events-none text-muted" />
      <Input
        type="search"
        placeholder="Search for coffee shops"
        className="pl-10 rounded-3xl w-full bg-light-gray text-primary-gray"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
  );
}

export function HomePageHeader() {
  const { mutate: reset, isPending } = useResetUser();
  return (
    <header className="flex flex-col p-6 pb-2 gap-6">
      <div className="flex flex-row items-center justify-between">
        <h1
          className="font-semibold font-drip text-4xl text-secondary-pop"
          onDoubleClick={() => reset()}
        >
          {isPending ? '...' : 'Drip'}
        </h1>
        {isDev() && (
          <div className="text-xs text-secondary-pop" onClick={() => reset()}>
            Reset
          </div>
        )}
      </div>

      <Search />
    </header>
  );
}
