'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label, Select } from '@/components/ui/input';
import { employeesApi } from '@/lib/api';

export default function RegisterEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: 'Demo@123',
    employee_code: '',
    full_name: '',
    designation: '',
    mobile: '',
    roles: ['employee'] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await employeesApi.create(form);
      router.push('/hr/employees');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HrGuard>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Register employee</h1>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            {(['full_name', 'email', 'password', 'employee_code', 'designation', 'mobile'] as const).map((field) => (
              <div key={field}>
                <Label>{field.replace('_', ' ')}</Label>
                <Input
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  required={['full_name', 'email', 'password', 'employee_code'].includes(field)}
                />
              </div>
            ))}
            <div>
              <Label>Role</Label>
              <Select
                value={form.roles[0]}
                onChange={(e) => setForm((f) => ({ ...f, roles: [e.target.value] }))}
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </Select>
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Create employee'}</Button>
          </form>
        </Card>
      </div>
    </HrGuard>
  );
}
