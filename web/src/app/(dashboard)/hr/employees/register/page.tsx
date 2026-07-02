'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, Input, Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { employeesApi } from '@/lib/api';

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full name',
  email: 'Email',
  password: 'Password',
  employee_code: 'Employee code',
  designation: 'Designation',
  mobile: 'Mobile',
};

export default function RegisterEmployeePage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    email: '',
    password: 'Demo@123',
    employee_code: '',
    full_name: '',
    designation: '',
    mobile: '',
    gender: '',
    date_of_birth: '',
    location: '',
    roles: ['employee'] as string[],
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await employeesApi.create({
        ...form,
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || undefined,
        location: form.location || undefined,
      });
      toast.success('Employee registered.');
      router.push('/hr/employees');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HrGuard>
      <>
        <PageHeader title="Register employee" description="Create a new employee account." />
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {(['full_name', 'email', 'password', 'employee_code', 'designation', 'mobile'] as const).map(
              (field) => (
                <FormField key={field} label={FIELD_LABELS[field] ?? field}>
                  <Input
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    required={['full_name', 'email', 'password', 'employee_code'].includes(field)}
                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  />
                </FormField>
              ),
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Gender">
                <Select
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </FormField>
              <FormField label="Date of birth">
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                />
              </FormField>
            </div>
            <FormField label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City / office"
              />
            </FormField>
            <FormField label="Role">
              <Select
                value={form.roles[0]}
                onChange={(e) => setForm((f) => ({ ...f, roles: [e.target.value] }))}
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </Select>
            </FormField>
            <Button type="submit" disabled={loading} className="self-start">
              {loading ? 'Saving…' : 'Create employee'}
            </Button>
          </form>
        </Card>
      </>
    </HrGuard>
  );
}
