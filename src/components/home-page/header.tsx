import { cn } from '@/lib/utils';
import { useResetUser } from '@/queries/UserQuery';
import { GpsFix } from '@phosphor-icons/react/dist/ssr';
import { Search as SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Divider } from '../ui/divider';
import {
  isLocationReady,
  useGeolocationPermissionState,
  useLocationState,
} from '@/lib/hooks/utility-hooks';

const useSearchInput = (int = 300) => {
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const timeout = search
      ? setTimeout(() => {
          setDebouncedSearch(search);
        }, int)
      : (() => {
          setDebouncedSearch(search);
        })();

    return () => {
      if (typeof timeout === 'number') clearTimeout(timeout);
    };
  }, [search, setSearch, int]);

  return { debouncedSearch, search, setSearch };
};

const SearchItem = ({ search }: { search: string }) => {
  return (
    <div className="flex flex-row gap-2">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-sm text-primary-gray">{search}</h3>
        <p className="text-sm text-primary-gray">{search}</p>
      </div>
    </div>
  );
};

const EnableNearest = () => {
  return (
    <div className="flex flex-row gap-2 items-center">
      <GpsFix size={24} />
      <p>near me</p>
    </div>
  );
};

const SearchResults = ({ search }: { search: string }) => {
  const geoLocationState = useGeolocationPermissionState();

  return (
    <div className="flex flex-col gap-2 bg-light-gray p-4 rounded-3xl mt-4 z-10 absolute w-full shadow-md">
      {(geoLocationState === 'prompt' || geoLocationState === 'denied') && (
        <>
          <EnableNearest />
          <Divider className="border-primary-gray" />
        </>
      )}

      <SearchItem search={search} />
    </div>
  );
};

export function Search() {
  const { search, setSearch, debouncedSearch } = useSearchInput();

  return (
    <div className="relative">
      <div className="relative w-full h-8 items-center flex">
        <SearchIcon className="absolute left-3 h-4 w-4 pointer-events-none text-muted" />
        <input
          type="search"
          placeholder="Search for coffee shops"
          className={cn(
            'flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50',
            'pl-10 rounded-3xl w-full bg-light-gray text-primary-gray',
          )}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {debouncedSearch && <SearchResults search={debouncedSearch} />}
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
      </div>

      <Search />
    </header>
  );
}
