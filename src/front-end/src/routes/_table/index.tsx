import { createFileRoute } from '@tanstack/react-router';
import styles from './styles.module.css';
import {
  Button,
  DatePicker,
  Flex,
  Table,
  TableColumnsType,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { DownloadOutlined } from '@ant-design/icons';
import useDataExport from '../../hooks/useDataExport';

export const Route = createFileRoute('/_table/')({
  component: RouteComponent,
});

type Record = {
  case_total: number;
  state_name: string;
  state_code: string;
  region_name: string;
  delta_day: number;
};

type AggregatedRecord = {
  region: string;
  total: number;
  states: {
    code: string;
    name: string;
    cases: number;
    delta: number;
  }[];
};

function RouteComponent() {
  // ---------------------------------
  // Data fetching
  // ---------------------------------

  const [date, setDate] = useState<dayjs.Dayjs | null>(null);

  const excelExport = useDataExport({
    date: date || dayjs(),
    onReady: handleExcelDownloadReady,
  });

  const intervalQuery = useQuery({
    queryKey: ['interval'],
    queryFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/interval`).then(
        (res) => res.json() as Promise<{ start: string; end: string }>,
      );
    },
  });

  const query = useQuery({
    queryKey: ['states', date?.format('YYYY-MM-DD')],
    queryFn: () => {
      return fetch(
        `${import.meta.env.VITE_API_URL}/api/states?date=${date?.format('YYYY-MM-DD')}`,
      ).then((res) => res.json() as Promise<Record[]>);
    },
    enabled: !!date,
  });

  // ---------------------------------
  // Memo
  // ---------------------------------

  const tableData = useMemo(() => {
    if (query.data) {
      const aggregated: AggregatedRecord[] = query.data.reduce(
        (acc: AggregatedRecord[], current: Record) => {
          const found = acc.find(
            (record) => record.region === current.region_name,
          );
          if (found) {
            found.total += current.case_total;
            found.states.push({
              name: current.state_name,
              cases: current.case_total,
              delta: current.delta_day,
              code: current.state_code,
            });
          } else {
            acc.push({
              region: current.region_name,
              total: current.case_total,
              states: [
                {
                  name: current.state_name,
                  cases: current.case_total,
                  delta: current.delta_day,
                  code: current.state_code,
                },
              ],
            });
          }
          return acc;
        },
        [],
      );
      return aggregated;
    }
    return [];
  }, [query.data]);

  // ---------------------------------
  // Effects
  // ---------------------------------

  useEffect(() => {
    if (intervalQuery.data) {
      setDate(dayjs(intervalQuery.data.end));
    }
  }, [intervalQuery.data]);

  // ---------------------------------
  // Functions
  // ---------------------------------

  function handleExcelDownloadReady(link: string) {
    const a = document.createElement('a');
    a.href = link;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ---------------------------------
  // Render
  // ---------------------------------

  return (
    <div className={styles.root}>
      <Typography.Title>Visualizzazione tabellare</Typography.Title>
      <Flex gap="small" style={{ marginBottom: 12 }}>
        <DatePicker
          style={{ minWidth: 200 }}
          value={date}
          onChange={setDate}
          format="D MMMM YYYY"
          minDate={
            intervalQuery.data?.start
              ? dayjs(intervalQuery.data.start)
              : undefined
          }
          maxDate={
            intervalQuery.data?.end ? dayjs(intervalQuery.data.end) : undefined
          }
          allowClear={false}
          presets={[
            {
              label: dayjs(intervalQuery.data?.start).format('DD/MM/YYYY'),
              value: dayjs(intervalQuery.data?.start),
            },
            {
              label: dayjs(intervalQuery.data?.end).format('DD/MM/YYYY'),
              value: dayjs(intervalQuery.data?.end),
            },
          ]}
        />
        <Button
          type="primary"
          htmlType="button"
          onClick={excelExport.initExport}
          loading={excelExport.loading}
        >
          Esporta <DownloadOutlined />
        </Button>
      </Flex>
      <Table
        loading={intervalQuery.isLoading || query.isLoading}
        dataSource={tableData}
        pagination={false}
        rowKey={(record) => record.region}
        columns={getColumns()}
        expandable={{
          expandedRowRender: (record) => (
            <Table
              dataSource={record.states}
              columns={getStateColumns()}
              rowKey={(r) => r.code}
              pagination={false}
            />
          ),
        }}
      />
    </div>
  );
}

function getColumns() {
  const c: TableColumnsType<AggregatedRecord> = [
    {
      key: 'region',
      title: 'Regione',
      dataIndex: 'region',
      sorter: {
        compare: (a, b) => a.region.localeCompare(b.region),
        multiple: 1,
      },
      defaultSortOrder: 'ascend',
    },
    {
      key: 'total',
      title: 'Totale casi',
      dataIndex: 'total',
      sorter: {
        compare: (a, b) => a.total - b.total,
        multiple: 2,
      },
      defaultSortOrder: 'descend',
    },
  ];
  return c;
}

function getStateColumns(): TableColumnsType<AggregatedRecord['states'][0]> {
  return [
    {
      key: 'code',
      dataIndex: 'code',
      width: 60,
    },
    {
      key: 'name',
      title: 'Provincia',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      defaultSortOrder: 'ascend',
    },
    {
      key: 'cases',
      title: 'Totale casi',
      dataIndex: 'cases',
      sorter: (a, b) => a.cases - b.cases,
    },
    {
      key: 'delta',
      title: 'Delta giorno prima',
      dataIndex: 'delta',
      sorter: (a, b) => a.delta - b.delta,
      render: (value) => (value > 0 ? `+${value}` : value),
    },
  ];
}
