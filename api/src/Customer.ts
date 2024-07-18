// Customer – Komponenta s vnějším API. Je schopna přijmout úkol ke zpracování. Vede si
// záznamy o prováděnych a dokončených úkolech, jejich stavech a pokroku provádění. Je
// schopna řídit provádění úkolů (zastavit, znovu spustit, odstranit).

import { Executor } from './Executor'; // Import the 'Executor' type

/**
 * Customer class
 */
export class Customer {
  private idCounter: number = 1;
  private params: any;
  public tasks: Executor[] = [];
  public completedTasks: Executor[] = [];
  private listeners: any[] = [];

  constructor(params?: any) {
    this.params = params;
  }

  /**
   * Event listener
   * @param event Event name
   * @param listener Event function
   */
  on(event: string, listener: any) {
    this.listeners.push({ event, listener });
  }

  /**
   * Remove event listener
   * @param event Event name
   * @param listener Event function
   */
  off(event: string, listener: any) {
    this.listeners = this.listeners.filter((l) => l.event !== event || l.listener !== listener);
  }

  /**
   * Emit event
   * @param event Event name
   * @param data Event data
   * @returns void
   * @throws Error
   */
  emit(event: string, data?: any) {
    this.listeners.forEach((l) => {
      if (l.event === event) {
        l.listener(data);
      }
    });
  }

  /**
   * Check if task exists
   * @param task Task
   * @returns boolean
   * @throws Error
   */
  taskExists (task: Executor) : boolean {
    return this.tasks.includes(task) || this.completedTasks.includes(task);
  }

  /**
   * Add task
   * @param task Task
   * @returns void
   * @throws Error
   */
  public addTask(task: Executor) : void {
    if (this.taskExists(task)) {
      throw new Error('Task already exists');
    }
    task.id = `${this.idCounter++}`;
    task.on('progress', (progress: number) => {
      this.emit('progress', { task, progress });
    });
    task.on('error', (error: any) => {
      this.emit('error', { task, error });
    });
    task.on('done', (result: any) => {
      this.emit('done', { task, result });
    });
    task.on('start', () => {
      this.emit('start', { task });
    });
    task.on('stop', () => {
      this.emit('stop', { task });
    });

    this.tasks.push(task);
  }

  /**
   * Get task by name
   * @param id Task ID
   * @returns Task
   * @throws Error
   */
  public getTask(id: any) : Executor {
    // Get task by name
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      return task;
    } else {
      const task = this.completedTasks.find((task) => task.id === id);
      if (task) {
        return task;
      } else {
        throw new Error('Task not found');
      }
    }
  }

  /**
   * Start task
   * @param task Task
   * @returns Promise
   * @throws Error
   */
  public async startTask (task: Executor) : Promise<any> {
    try {
      if (!this.taskExists(task)) {
        this.addTask(task);
      }
      const result = await task.run(this.params);
      console.log('task result', task.id, result);
      if (result === 'OK') {
        this.completedTasks.push(task);
        this.removeTask(task);
      }
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Stop task
   * @param task Task
   * @returns void
   * @throws Error
   */
  public stopTask(task: Executor) {
    // Stop task
    task?.isRunning && task.stop();
  }

  /**
   * Restart task
   * @param task Task
   * @returns Promise
   * @throws Error
   */
  public restartTask(task: Executor): Promise<any> {
    if (!task?.isRunning) {
      return task.run(this.params);
    } else {
      throw new Error('Task is already running');
    }
  }

  /**
   * Remove task
   * @param task Task
   * @returns void
   * @throws Error
   */
  public removeTask(task: Executor) {
    const index = this.tasks.indexOf(task);
    if (index > -1) {
      task.isRunning && task.stop(); //TODO: muzeme vyhodit chybu pokud bezi, ale task zastavime a odstranime
      this.tasks.splice(index, 1);
    } else {
      const index = this.completedTasks.indexOf(task);
      if (index > -1) {
        this.completedTasks.splice(index, 1);
      } else {
        throw new Error('Task not found');
      }
    }
  }
}
