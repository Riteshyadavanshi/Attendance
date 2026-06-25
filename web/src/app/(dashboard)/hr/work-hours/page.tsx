'use client';

import { useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { attendanceRulesApi, type AttendanceRules } from '@/lib/api';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function WorkHoursPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [lateGrace, setLateGrace] = useState('15');
  const [standardHours, setStandardHours] = useState('8');
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage('Use HH:MM format for times.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await attendanceRulesApi.update({
        work_start_time: workStart,
        work_end_time: workEnd,
        late_threshold_minutes: parseInt(lateGrace, 10),
        standard_hours: parseFloat(standardHours),
        half_day_threshold_hours: 4,
      });
      applyRules(updated);
      setMessage('Work hours saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrGuard>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Work hours</h1>
        <Card>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={onSave} className="space-y-4">
              <div>
                <Label>Work start (HH:MM)</Label>
                <Input value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
              </div>
              <div>
                <Label>Work end (HH:MM)</Label>
                <Input value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
              </div>
              <div>
                <Label>Late grace (minutes)</Label>
                <Input value={lateGrace} onChange={(e) => setLateGrace(e.target.value)} />
              </div>
              <div>
                <Label>Standard hours</Label>
                <Input value={standardHours} onChange={(e) => setStandardHours(e.target.value)} />
              </div>
              {message && <p className="text-sm font-medium text-primary">{message}</p>}
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save rules'}</Button>
            </form>
          )}
        </Card>
      </div>
    </HrGuard>
  );
}
