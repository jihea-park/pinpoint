import React from 'react';
import { ErrorBoundary } from '../..';
import { CallTreeCore } from './CallTreeCore';
import { useGetTransactionCallTree } from '@pinpoint-fe/ui/src/hooks';
import { TransactionListSkeleton } from '../transaction-list/TransactionListSkeleton';

export const CallTree = () => {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<TransactionListSkeleton />}>
        <CallTreeFetcher />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export const CallTreeFetcher = () => {
  const { data, tableData, mapData } = useGetTransactionCallTree();

  if (!data) return null;

  return <CallTreeCore data={tableData} metaData={data} mapData={mapData || []} />;
};
