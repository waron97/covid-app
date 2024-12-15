import { createFileRoute } from '@tanstack/react-router';
import styles from './styles.module.css';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Spin, Typography } from 'antd';
import { Line } from 'react-chartjs-2';
import { ChartData, registerables } from 'chart.js';
import { Chart } from 'chart.js';
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

  const intervalQuery = useQuery({
    queryKey: ['interval'],
    queryFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/interval`).then(
        (res) => res.json() as Promise<{ start: string; end: string }>,
      );
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

  const chartLabels = useMemo(() => {
    return getDates().map((d) => d.format('DD/MM/YYYY'));
  }, [query.data]);

  const chartDatasets = useMemo(() => {
    return getDatasets();
  }, [query.data, regionColors]);

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
    const regions = query.data.map((r) => r.region_name).filter(distinct);
    const dates = getDates();
    return regions.map((regionName) => {
      const data: number[] = dates.map(
        (d) =>
          query.data.find(
            (record) =>
              record.region_name == regionName && record.date === f(d),
          )?.case_total || 0,
      );
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
          marginBottom: 36,
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
      <Spin spinning={query.isLoading}>
        <div
          style={{
            // height: 400,
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
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
