'use client';

import { Loader2, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { employeesApi, type EmployeeRecord } from '@/lib/api';

const PAGE_SIZE = 20;

export default function EmployeeListPage() {
  const toast = useToast();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(
    async (pageNum: number, term: string, append: boolean) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const data = await employeesApi.list(pageNum, PAGE_SIZE, term);
        setEmployees((prev) => (append ? [...prev, ...data.items] : data.items));
        setPage(data.page);
        setHasMore(data.has_more);
        setTotal(data.total);
      } catch (err) {
        if (!append) setEmployees([]);
        toast.error(err instanceof Error ? err.message : 'Could not load employees');
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchPage(1, debounced, false);
  }, [debounced, fetchPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingRef.current) {
          fetchPage(page + 1, debounced, true);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, page, debounced, fetchPage]);

  return (
    <HrGuard>
      <>
        <PageHeader
          title="All employees"
          description={`${total} total`}
          actions={
            <Link href="/hr/employees/register">
              <Button>Register</Button>
            </Link>
          }
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, designation, or email…"
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </span>
            <p className="font-semibold text-foreground">
              {debounced ? 'No matching employees' : 'No employees found'}
            </p>
            {debounced && <p className="text-sm text-muted-foreground">Try a different search term.</p>}
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {employees.map((e) => (
              <Card key={e.id}>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-mono text-sm font-bold text-primary">{e.employee_code}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{e.full_name}</p>
                    <p className="truncate text-sm text-muted-foreground">{e.email ?? '—'}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{e.designation ?? '—'}</p>
                </div>
              </Card>
            ))}

            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading more…
              </div>
            )}
            {!hasMore && employees.length > 0 && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                Showing all {employees.length} of {total}
              </p>
            )}
          </div>
        )}
      </>
    </HrGuard>
  );
}
