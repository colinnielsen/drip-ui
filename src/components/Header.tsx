;
import { Input } from "@/components/shadcn/input";
import { useState } from "react";

export function Header() {
  return (
    <header className="flex flex-col p-6 gap-6">
      <h1 className="text-4xl font-semibold font-drip">Drip</h1>
      <Search />
    </header>
  );
}

export function Search() {
  const [search, setSearch] = useState<string>("");
  return (
    <div className="relative w-full h-8 items-center flex">
      <SearchIcon className="absolute left-3 h-4 w-4 pointer-events-none text-muted" />
      <Input
        type="search"
        placeholder="Search for coffee shops"
        className="pl-10 rounded-3xl w-full bg-neutral-100"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}

export function SearchIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M21 21l-5.2-5.2"
      />
      <circle cx={10} cy={10} r={8} />
    </svg>
  );
}
