'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { employeesApi, type EmployeeRecord } from '@/lib/api';

const PAGE_SIZE = 20;

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    try {
      const data = await employeesApi.list(pageNum, PAGE_SIZE);
      setEmployees((prev) => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setHasMore(data.has_more);
      setTotal(data.total);
    } catch {
      if (!append) setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  return (
    <HrGuard>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">All employees</h1>
            <p className="text-sm text-slate-500">{total} total</p>
          </div>
          <Link href="/hr/employees/register"><Button>Register</Button></Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : employees.length === 0 ? (
          <Card><p className="text-sm text-slate-500">No employees found.</p></Card>
        ) : (
          <div className="space-y-2">
            {employees.map((e) => (
              <Card key={e.id}>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-mono text-sm font-bold text-indigo-600">{e.employee_code}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{e.full_name}</p>
                    <p className="text-sm text-slate-500">{e.email ?? '—'}</p>
                  </div>
                  <p className="text-sm text-slate-600">{e.designation ?? '—'}</p>
                </div>
              </Card>
            ))}
            {hasMore && (
              <Button variant="outline" className="w-full" onClick={() => load(page + 1, true)}>
                Load more
              </Button>
            )}
          </div>
        )}
      </div>
    </HrGuard>
  );
}
