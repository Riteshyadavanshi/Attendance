import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { employeesApi, type EmployeeRecord } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Button } from '../../components/ui/Button';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { spacing } from '../../theme/colors';

const PAGE_SIZE = 20;

type Nav = NativeStackNavigationProp<MainStackParamList>;

function EmployeeRow({ item, colors }: { item: EmployeeRecord; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.cardBorder, backgroundColor: colors.card }]}>
      <Text style={[styles.cellCode, { color: colors.primary }]}>{item.employee_code}</Text>
      <View style={styles.cellMain}>
        <Text style={[styles.cellName, { color: colors.text }]} numberOfLines={1}>
          {item.full_name}
        </Text>
        <Text style={[styles.cellSub, { color: colors.textMuted }]} numberOfLines={1}>
          {item.email ?? '—'}
        </Text>
      </View>
      <Text style={[styles.cellDesignation, { color: colors.textSecondary }]} numberOfLines={1}>
        {item.designation ?? '—'}
      </Text>
    </View>
  );
}

export function EmployeeListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);

  const loadEmployees = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await employeesApi.list(pageNum, PAGE_SIZE);
      const items = data.items ?? [];
      setEmployees((prev) => (append ? [...prev, ...items] : items));
      setPage(data.page);
      setHasMore(data.has_more);
      setTotal(data.total);
    } catch (e) {
      if (!append) setEmployees([]);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load employees');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEmployees(1, false);
    }, [loadEmployees]),
  );

  const onLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    loadEmployees(page + 1, true);
  };

  const tableHeader = (
    <View>
      <View style={styles.toolbar}>
        <Text style={[styles.count, { color: colors.textMuted }]}>
          {total > 0 ? `${employees.length} of ${total}` : 'Employees'}
        </Text>
        <Button
          label="Register"
          fullWidth={false}
          onPress={() => navigation.navigate('RegisterEmployee')}
          icon={<Ionicons name="person-add-outline" size={18} color="#FFF" />}
          style={styles.registerBtn}
        />
      </View>
      <View style={[styles.tableHead, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[styles.headText, styles.colCode, { color: colors.textMuted }]}>Code</Text>
        <Text style={[styles.headText, styles.colMain, { color: colors.textMuted }]}>Employee</Text>
        <Text style={[styles.headText, styles.colRole, { color: colors.textMuted }]}>Role</Text>
      </View>
    </View>
  );

  return (
    <StackShell title="Employees" scroll={false}>
      <View style={styles.listWrap}>
        {loading && employees.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={tableHeader}
            ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            {total === 0 && !loading
              ? 'No employees in your organization yet. Tap Register to add one.'
              : 'No employees found'}
          </Text>
        }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
              ) : hasMore ? null : (
                <Text style={[styles.endText, { color: colors.textMuted }]}>
                  {total > 0 ? `All ${total} employees loaded` : ''}
                </Text>
              )
            }
            renderItem={({ item }) => <EmployeeRow item={item} colors={colors} />}
          />
        )}
      </View>
    </StackShell>
  );
}

const styles = StyleSheet.create({
  listWrap: { flex: 1, marginHorizontal: -spacing.md },
  loader: { marginTop: 40 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  count: { fontSize: 14, fontWeight: '600' },
  registerBtn: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  headText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  colCode: { width: 56 },
  colMain: { flex: 1 },
  colRole: { width: 88, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellCode: { width: 56, fontSize: 12, fontWeight: '700' },
  cellMain: { flex: 1, paddingRight: spacing.sm },
  cellName: { fontSize: 15, fontWeight: '600' },
  cellSub: { fontSize: 12, marginTop: 2 },
  cellDesignation: { width: 88, fontSize: 12, textAlign: 'right' },
  empty: { textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.md },
  footerLoader: { marginVertical: spacing.md },
  endText: { textAlign: 'center', fontSize: 12, marginVertical: spacing.md },
});
