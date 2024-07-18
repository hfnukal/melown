"use client";
import { Api, Task } from '@/Api';
import { createContext, useContext, useEffect, useState } from 'react';

export type AppContextValue = {
  api: Api;
  tasks: Task[];
  completedTasks: Task[];
};

const api = new Api();

export const AppContext = createContext({
  api: api as Api,
  tasks: [] as ReturnType<typeof useTasks>['tasks'],
  completedTasks: [] as ReturnType<typeof useTasks>['completedTasks'],
} as unknown as AppContextValue );

export const useTasks = () => {
  const [tasks, setTasks] = useState([] as Task[]);
  const [completedTasks, setCompletedTasks] = useState([] as Task[]);

  const loadTasks = async () => {
    const tasks = await api.getTasks();
    // console.log('loadTasks', tasks);
    setTasks(tasks);
  }

  const loadCompletedTasks = async () => {
    const tasks = await api.getCompletedTasks();
    setCompletedTasks(tasks);
  }

  const updateTask = (id: string, task: any) => {
    // console.log('updateTask', { id, task });
    const t = tasks.find((t) => t.id === id);
    if (t) {
      Object.assign(t, task);
      setTasks([...tasks]);
    }
  }

  const addTask = async (task: Task) => {
    // Add task
    console.log('addTask', task);
    return api.addTask(task);
  }

  const removeTask = async (id: string) => {
    // Remove task
    console.log('removeTask', id);
    return api.removeTask(id);
  }

  useEffect(() => {
    loadTasks();
    loadCompletedTasks();
  }, []);

  return {
    tasks: tasks as Task[],
    completedTasks: completedTasks as Task[],
    loadTasks: loadTasks as () => void,
    loadCompletedTasks: loadCompletedTasks as () => void,
    addTask: addTask as (task: Task) => any,
    updateTask: updateTask as (id: string, task: any) => void,
    removeTask: removeTask as (id: string) => any,
  };
}

export const useApi = () => {
  const { api } = useContext(AppContext);
  return api;
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { tasks, completedTasks } = useTasks();
  return (
    <AppContext.Provider value={{
      api,
      tasks,
      completedTasks
    } as AppContextValue }>
      {children}
    </AppContext.Provider>
  );
};
