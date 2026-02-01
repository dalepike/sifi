"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Search as SearchIcon, Package, Box, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { searchItems } from "@/actions/items";
import type { ItemWithLocation } from "@/types/domain";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemWithLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await searchItems(query);
      if (result.success) {
        setResults(result.data);
      }
      setSearched(true);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setSearched(false);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground">
          Find items by name or description
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : query.length > 0 && query.length < 2 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Type at least 2 characters to search
          </CardContent>
        </Card>
      ) : searched && results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No results found</p>
            <p className="text-muted-foreground">
              Try a different search term
            </p>
          </CardContent>
        </Card>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "result" : "results"} found
          </p>
          <div className="grid gap-2">
            {results.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-accent">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {item.type === "container" ? (
                        <Box className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          <HighlightMatch text={item.name} query={query} />
                        </p>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {item.humanReadableCode}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.locationPath.length > 0
                          ? item.locationPath.map((l) => l.name).join(" → ")
                          : "No location"}
                      </p>
                      {item.description && (
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                          <HighlightMatch text={item.description} query={query} />
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">Search your inventory</p>
            <p className="text-muted-foreground">
              Enter a search term to find items by name or description
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component to highlight matching text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
