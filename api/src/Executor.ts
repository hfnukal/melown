// Testovaci ukol. Vraci Promise. Dobu běhu zvolí náhodně z rozsahu 5 sekund až 2 minuty.
// Provádění úkolu může skončit (náhodně generovanou)
// chybou, kterou je třeba zachytit a dle jejího typu reagovat.


export type ExecutorConfig = {
  errorRate?: number;
  minTime?: number;
  maxTime?: number;
  progressSlice?: number;
};

export const defaultConfig: ExecutorConfig = {
  errorRate: 0.001,
  minTime: 5000,
  maxTime: 115000,
  progressSlice: 1000,
}

/**
 * Executor class
 */
export class Executor {
  id: string | null = null;
  name: string;
  isRunning: boolean = false;
  timer: any;
  promise!: Promise<any>;
  config: any;
  resolve: any;
  reject: any;
  progress: number = 0;
  exitState: { state: string, message?: string } | null = null;

  listeners: any[] = [];

  constructor(name: string, config?: ExecutorConfig) {
    this.name = name;
    this.config = {
      ...defaultConfig,
      ...config
    };
    console.log(this.name, 'Executor created');
  }

  /**
   * Event listener
   * @param event Event name
   * @param listener Event function
   * @returns void
   * @throws Error
   */
  on (event: string, listener: any) {
    this.listeners.push({ event, listener });
  }

  /**
   * Remove event listener
   * @param event Event name
   * @param listener Event function
   * @returns void
   * @throws Error
   */
  off (event: string, listener: any) {
    this.listeners = this.listeners.filter((l) => l.event !== event || l.listener !== listener);
  }

  /**
   * Emit event
   * @param event Event name
   * @param data Event data
   * @returns void
   * @throws Error
   */
  emit (event: string, data?: any) {
    this.listeners.forEach((l) => {
      if (l.event === event) {
        l.listener(data);
      }
    });
  }

  /**
   * Run task
   * @param params Task parameters
   * @returns Promise
   * @throws Error
   */
  async run (params: any): Promise<any> {
    this.isRunning = true;
    this.emit('start');
    this.promise = new Promise(async (resolve, reject) => {
      console.log(this.name, 'Executor started', params);
      this.resolve = resolve;
      this.reject = reject;

      const time = Math.floor(Math.random() * this.config.maxTime) + this.config.minTime;
      for (let i = 0; i < time; i = i + this.config.progressSlice) {
        this.onProgress(i / time);
        const vm = this;
        try {
          await new Promise((resolve, reject) => {
            vm.timer = setTimeout(() => {
              if (Math.random() < this.config.errorRate) {
                this.stop();
                this.emit('error', 'Random error');

                return reject('Random error');
              } else {
                return resolve(true);
              }
            }, this.config.progressSlice);
          })
        } catch (error) {
          console.log(this.name, 'Error:', error);
          this.emit('error', error);
          this.exitState = {
            state: 'ERROR',
            message: error as string,
          };
          return reject(error);
        }
      }
      this.onProgress(1);
      this.exitState = {
        state: 'OK',
        message: 'Task finished OK',
      };
      this._stop();
      // console.log(this.name, 'Executor finished');
      this.emit('done');
      resolve('OK');
    });
    return await this.promise
  };

  /**
   * Stop task
   * @returns void
   * @throws Error
   */
  _stop () {
    console.log(this.name, 'Stop task');
    this.timer && clearTimeout(this.timer);
    this.isRunning = false;
    this.emit('stop');
  }

  /**
   * Stop task
   * @returns void
   * @throws Error
   */
  stop () {
    this._stop();
    this.resolve('STOPPED');
  }

  /**
   * Set progress
   * @param progress Progress
   * @returns void
   * @throws Error
   */
  onProgress (progress: number) {
    this.progress = progress;
    this.emit('progress');
  }
}
