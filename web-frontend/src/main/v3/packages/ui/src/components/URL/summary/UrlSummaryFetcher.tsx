import React from 'react';
import { useAtom } from 'jotai';
import { urlSelectedSummaryDataAtom } from '@pinpoint-fe/ui/src/atoms';
import { useGetUrlStatSummaryData } from '@pinpoint-fe/ui/src/hooks';
import { summaryColumns } from './UrlSummaryColumns';
import { DataTableCountOfRows, VirtualizedDataTable } from '../../DataTable';
import { cn } from '../../../lib';
import { UrlStatSummary } from '@pinpoint-fe/ui/src/constants';

export interface UrlSummaryFetcherProps {
  type?: UrlStatSummary.Parameters['type'];
  className?: string;
}

export const UrlSummaryFetcher = ({ className, type }: UrlSummaryFetcherProps) => {
  const [urlSelectedSummaryData, setUrlSelectedSummaryData] = useAtom(urlSelectedSummaryDataAtom);
  const [count, setCount] = React.useState(50);
  const [orderBy, setOrderBy] = React.useState('totalCount');
  const [isDesc, setIsDesc] = React.useState(true);
  const { data } = useGetUrlStatSummaryData({
    count,
    isDesc,
    orderBy,
    type,
  });
  const columns = summaryColumns({
    orderBy,
    isDesc,
    onClickColumnHeader: (key) => {
      if (orderBy === key) {
        setIsDesc(!isDesc);
      } else {
        setIsDesc(true);
      }

      setOrderBy(key);
    },
  });

  const getRowSelectionInfo = () => {
    const selectedRowIndex =
      data?.findIndex(({ uri }) => uri === urlSelectedSummaryData?.uri) || -1;

    return selectedRowIndex === -1 ? {} : { [selectedRowIndex]: true };
  };

  return (
    <>
      <DataTableCountOfRows
        triggerClassName="mt-10 mb-2"
        selectedCount={count}
        onChange={(c) => setCount(c)}
      />
      <div className={cn('max-h-[calc(100%-26rem)] rounded-md border bg-white', className)}>
        <VirtualizedDataTable
          tableClassName="text-xs"
          columns={columns}
          data={data || []}
          rowSelectionInfo={getRowSelectionInfo()}
          onChangeRowSelection={(data) => {
            setUrlSelectedSummaryData(data[0]);
          }}
        />
      </div>
    </>
  );
};
