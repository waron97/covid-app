import { createFileRoute } from '@tanstack/react-router';
import styles from './styles.module.css';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Button, Checkbox, DatePicker, Spin, Typography } from 'antd';
import { Line } from 'react-chartjs-2';
import { ChartData, registerables } from 'chart.js';
import { Chart } from 'chart.js';
import { Record as DayRecord } from '../_table';
Chart.register(...registerables);

export const Route = createFileRoute('/chart/')({
  component: RouteComponent,
});

type Record = {
  case_total: number;
  date: string;
  region_name: string;
};

function RouteComponent() {
  // ---------------------------------
  // Data fetching
  // ---------------------------------

  const [range, setRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);
  const [start, end] = range;

  const [regionColors, setRegionColors] = useState<Map<string, string> | null>(
    null,
  );

  const [normalizeByMax, setNormalizeByMax] = useState(false);

  const intervalQuery = useQuery({
    queryKey: ['interval'],
    queryFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/interval`).then(
        (res) => res.json() as Promise<{ start: string; end: string }>,
      );
    },
  });

  const lastAvailableDayQuery = useQuery({
    queryKey: ['states', f(dayjs(intervalQuery.data?.end))],
    enabled: !!intervalQuery.data?.end,
    queryFn: () => {
      return fetch(
        `${import.meta.env.VITE_API_URL}/api/states?date=${f(dayjs(intervalQuery.data?.end))}`,
      ).then((res) => res.json() as Promise<DayRecord[]>);
    },
  });

  const query = useQuery({
    queryKey: ['regions', f(start), f(end)],
    enabled: !!start && !!end,
    queryFn: () => {
      return fetch(
        `${import.meta.env.VITE_API_URL}/api/regions?start=${f(start)}&end=${f(end)}`,
      ).then((res) => res.json() as Promise<Record[]>);
    },
  });

  useEffect(() => {
    if (intervalQuery.data) {
      const { start } = intervalQuery.data;
      setRange([dayjs(start), dayjs(start).add(1, 'month')]);
    }
  }, [intervalQuery.data]);

  // ---------------------------------
  // Memos
  // ---------------------------------

  useEffect(() => {
    if (!regionColors && query.data) {
      const colorMap = new Map();
      const regionNames = query.data.map((r) => r.region_name).filter(distinct);
      for (let i = 0; i < regionNames.length; i++) {
        const color =
          'hsl(' + ((i * (360 / regionNames.length)) % 360) + ',100%,50%)';
        colorMap.set(regionNames[i], color);
      }
      setRegionColors(colorMap);
    }
  }, [query.data, regionColors]);

  const regionMaxValues = useMemo(() => {
    if (!lastAvailableDayQuery.data) {
      return null;
    }
    const m = new Map<string, number>();
    lastAvailableDayQuery.data.forEach((row) => {
      m.set(row.region_name, (m.get(row.region_name) || 0) + row.case_total);
    });
    return m;
  }, [lastAvailableDayQuery]);

  const chartLabels = useMemo(() => {
    return getDates().map((d) => d.format('DD/MM/YYYY'));
  }, [query.data]);

  const chartDatasets = useMemo(() => {
    return getDatasets();
  }, [query.data, regionColors, normalizeByMax, regionMaxValues]);

  // ---------------------------------
  // Functions
  // ---------------------------------

  function distinct<T>(item: T, index: number, self: T[]) {
    return self.indexOf(item) === index;
  }

  function f(d: dayjs.Dayjs | null) {
    if (!d) {
      return null;
    }
    return d.format('YYYY-MM-DD');
  }

  function getDates(): dayjs.Dayjs[] {
    if (!query.data) {
      return [];
    }
    const distinctDates = query.data
      .map((record) => record.date)
      .filter(distinct)
      .map((d) => dayjs(d));
    distinctDates.sort((a, b) => a.diff(b, 'day'));
    return distinctDates;
  }

  function getDatasets(): ChartData<'line'>['datasets'] {
    if (!query.data || !regionColors) {
      return [];
    }
    if (normalizeByMax && !regionMaxValues) {
      return [];
    }
    const regions = query.data.map((r) => r.region_name).filter(distinct);
    regions.sort((a, b) => a.localeCompare(b));
    const dates = getDates();
    return regions.map((regionName) => {
      let data: number[] = dates.map(
        (d) =>
          query.data.find(
            (record) =>
              record.region_name == regionName && record.date === f(d),
          )?.case_total || 0,
      );

      if (normalizeByMax) {
        data = data.map((v) => v / regionMaxValues!.get(regionName)!);
      }

      return {
        data,
        label: regionName,
        borderColor: regionColors.get(regionName),
        backgroundColor: regionColors.get(regionName),
      };
    });
  }

  function showPrevMonth() {
    setRange([
      dayjs(start).subtract(1, 'month'),
      dayjs(end).subtract(1, 'month'),
    ]);
  }

  function showNextMonth() {
    setRange([dayjs(start).add(1, 'month'), dayjs(end).add(1, 'month')]);
  }

  // ---------------------------------
  // Render
  // ---------------------------------
  return (
    <div className={styles.root}>
      <Typography.Title>Visualizzazione grafico</Typography.Title>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <Button onClick={showPrevMonth}>Mese precedente</Button>
        <DatePicker.RangePicker
          value={range}
          onChange={(d) => d && setRange(d)}
          allowClear={false}
        />
        <Button onClick={showNextMonth}>Mese successivo</Button>
      </div>
      <div
        style={{ marginBottom: 36, display: 'flex', justifyContent: 'center' }}
      >
        <Checkbox
          checked={normalizeByMax}
          onChange={(v) => setNormalizeByMax(v.target.checked)}
        >
          Normalizza per totale casi
        </Checkbox>
      </div>
      <Spin spinning={query.isLoading}>
        <div
          style={{
            height: 500,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Line
            data={{
              labels: chartLabels,
              datasets: chartDatasets,
            }}
            options={{
              plugins: {
                legend: {
                  display: true,
                },
              },
            }}
          />
        </div>
      </Spin>
    </div>
  );
}
