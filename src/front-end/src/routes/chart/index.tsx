import { createFileRoute } from '@tanstack/react-router';
import { Button, Checkbox, DatePicker, Spin, Typography } from 'antd';
import { Chart, registerables } from 'chart.js';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import useChart from '../../hooks/_useChart';
import styles from './styles.module.css';
Chart.register(...registerables);

export const Route = createFileRoute('/chart/')({
  component: RouteComponent,
});

function RouteComponent() {
  // ---------------------------------
  // Data fetching
  // ---------------------------------

  const [range, setRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);
  const [start, end] = range;

  const [normalizeByMax, setNormalizeByMax] = useState(false);

  const { chartDatasets, chartLabels, intervalQuery, query } = useChart(
    range,
    normalizeByMax,
  );

  // ---------------------------------
  // Effects
  // ---------------------------------

  useEffect(() => {
    if (intervalQuery.data) {
      const { start } = intervalQuery.data;
      setRange([dayjs(start), dayjs(start).add(1, 'month')]);
    }
  }, [intervalQuery.data]);

  // ---------------------------------
  // Functions
  // ---------------------------------

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
