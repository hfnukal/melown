const API_URL = process.env.API_URL || 'http://localhost:3333';

export type Task = {
  id?: string;
  name: string;
  progress?: number;
  isRunning?: boolean;
  exitState?: { state: string, message?: string };
};

export const debounce = (fn: any, delay: number) : any => {
  let timer: any = null;

  return async (...args: any[]) => {
    if (timer) clearTimeout(timer);
    return await new Promise((resolve) => {
      timer = setTimeout(() => resolve(fn(...args)), delay);
    });
  };
}

export class Api {
  constructor() {
    console.log('Api created');
  }

  async getTasks() {
    return await debounce(async () => {
      try {
        const response = await fetch(`${API_URL}/tasks`);
        const { status, tasks } = await response.json();
        if (status === 'OK') {
          return tasks;
        }
      } catch (error) {
        console.error('getTasks', error);
      }
      return [];
    }, 400)();
  }

  async getCompletedTasks() {
    return await debounce(async () => {
      try {
        const response = await fetch(`${API_URL}/completedTasks`);
        const { status, tasks } = await response.json();
        if (status === 'OK') {
          return tasks;
        }
      } catch (error) {
        console.error('getCompletedTasks', error);
      }
      return [];
    }, 400)();
  }

  async addTask(task: Task) {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: task.name,
      }
      ),
    });
    const data = await response.json();
    return data;
  }

  async startTask(id: any) {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}/start`, {
        method: 'POST',
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response;
      })
      .catch((error) => {
        throw error;
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async stopTask(id: any) {
    const response = await fetch(`${API_URL}/tasks/${id}/stop`, {
      method: 'POST',
    });
    return response.json();
  }

  async getTask(id: string) {
    const response = await fetch(`${API_URL}/tasks/${id}`);
    return response.json();
  }

  async removeTask(id: string) {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    } catch (error) {
      console.log('removeTask ERROR:', error);
      throw error;
    }
  }
}