import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Record as DayRecord } from '../routes/_table';
import { ChartData } from 'chart.js';

export type Record = {
  case_total: number;
  date: string;
  region_name: string;
};

export default function useChart(
  range: [dayjs.Dayjs | null, dayjs.Dayjs | null],
  normalizeByMax: boolean,
) {
  // STATE

  const [start, end] = range;

  const [regionColors, setRegionColors] = useState<Map<string, string> | null>(
    null,
  );

  // QUERIES

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

  // COMPUTATION

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

  // HELPER FUNCTIONS

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

  function distinct<T>(item: T, index: number, self: T[]) {
    return self.indexOf(item) === index;
  }

  function f(d: dayjs.Dayjs | null) {
    if (!d) {
      return null;
    }
    return d.format('YYYY-MM-DD');
  }

  // ----------------------------------------

  return {
    intervalQuery,
    query,
    regionColors,
    regionMaxValues,
    chartLabels,
    chartDatasets,
  };
}
