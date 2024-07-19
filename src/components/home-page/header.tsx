import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';

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
  return (
    <header className="flex flex-col p-6 pb-2 gap-6">
      <h1 className="font-semibold font-drip text-4xl text-secondary-pop">
        Drip
      </h1>
      <Search />
    </header>
  );
}
