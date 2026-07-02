'use client';

import { useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { attendanceRulesApi, type AttendanceRules } from '@/lib/api';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function WorkHoursPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [lateGrace, setLateGrace] = useState('15');
  const [standardHours, setStandardHours] = useState('8');

  const applyRules = (rules: AttendanceRules) => {
    setWorkStart(rules.work_start_time);
    setWorkEnd(rules.work_end_time);
    setLateGrace(String(rules.late_threshold_minutes));
    setStandardHours(String(rules.standard_hours));
  };

  useEffect(() => {
    attendanceRulesApi.get().then(applyRules).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!TIME_PATTERN.test(workStart) || !TIME_PATTERN.test(workEnd)) {
      toast.warning('Use HH:MM format for times.');
      return;
    }
    setSaving(true);
    try {
      const updated = await attendanceRulesApi.update({
        work_start_time: workStart,
        work_end_time: workEnd,
        late_threshold_minutes: parseInt(lateGrace, 10),
        standard_hours: parseFloat(standardHours),
        half_day_threshold_hours: 4,
      });
      applyRules(updated);
      toast.success('Work hours saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrGuard>
      <>
        <PageHeader title="Work hours" description="Configure attendance rules and late thresholds." />
        <Card>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={onSave} className="flex flex-col gap-4">
              <FormField label="Work start (HH:MM)">
                <Input value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
              </FormField>
              <FormField label="Work end (HH:MM)">
                <Input value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
              </FormField>
              <FormField label="Late grace (minutes)">
                <Input value={lateGrace} onChange={(e) => setLateGrace(e.target.value)} />
              </FormField>
              <FormField label="Standard hours">
                <Input value={standardHours} onChange={(e) => setStandardHours(e.target.value)} />
              </FormField>
              <Button type="submit" disabled={saving} className="self-start">
                {saving ? 'Saving…' : 'Save rules'}
              </Button>
            </form>
          )}
        </Card>
      </>
    </HrGuard>
  );
}
