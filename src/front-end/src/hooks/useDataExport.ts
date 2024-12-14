import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

type TaskResult = {
  ready: boolean;
  successful: boolean;
  value: string;
};

type TaskPayload = {
  task_id: string;
};

type Args = { date: dayjs.Dayjs; onReady: (donwloadLink: string) => void };

export default function useDataExport(args: Args) {
  const { date, onReady } = args;

  const [taskId, setTaskId] = useState<string | undefined>();
  const taskQuery = useQuery({
    queryKey: ['tasks', taskId],
    enabled: !!taskId,
    queryFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/result/${taskId}`).then(
        (res) => res.json() as Promise<TaskResult>,
      );
    },
    refetchInterval: 1000,
  });

  function initExport() {
    return fetch(
      `${import.meta.env.VITE_API_URL}/api/export?date=${date.format('YYYY-MM-DD')}`,
    )
      .then((res) => res.json() as Promise<TaskPayload>)
      .then((p) => setTaskId(p.task_id));
  }

  useEffect(() => {
    if (taskQuery.data?.ready) {
      onReady(taskQuery.data.value);
      setTaskId(undefined);
    }
  }, [taskQuery.data]);

  return {
    initExport,
    loading: taskQuery.isLoading || taskQuery.data?.ready == false,
  };
}
