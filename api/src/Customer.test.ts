import {beforeEach, describe, expect, test} from '@jest/globals';
import { Customer } from './Customer';
import { Executor } from './Executor';

const testExecutorConfig = {
  // errorRate: 0.1,
  errorRate: -1,
  minTime: 200,
  maxTime: 1000,
  progressSlice: 100,
};

describe('Customer', () => {
  let customer: Customer;
  let executor: Executor;

  beforeEach(() => {
    executor = new Executor('TEST Executor', testExecutorConfig);
    customer = new Customer({ test: 'test' });
  }
  );

  test('should create Customer', () => {
    expect(customer).toBeInstanceOf(Customer);
  });

  // test('should add task', () => {
  //   customer.addTask(executor);
  //   expect(customer['tasks']).toContain(executor);
  // });

  // test('should start task', async () => {
  //   const result = await customer.startTask(executor);
  //   expect(result).toBe('OK');
  //   expect(customer['completedTasks']).toContain(executor);
  // });

  // test('should stop task', async () => {
  //   const result = customer.startTask(executor);
  //   customer.stopTask(executor);
  //   expect(executor.isRunning).toBe(false);
  //   await result;
  // });

  // test('should restart task', async () => {
  //   const result1 = customer.startTask(executor);
  //   customer.stopTask(executor);
  //   expect(executor.isRunning).toBe(false);
  //   expect(await result1).toBe('STOPPED');
  //   const result2 = customer.restartTask(executor);
  //   expect(executor.isRunning).toBe(true);
  //   expect(await result2).toBe('OK');
  // });

  // test('should remove task', () => {
  //   customer.addTask(executor);
  //   customer.removeTask(executor);
  //   expect(customer['tasks']).not.toContain(executor);
  // });

  // test('should throw error when task is already running', async () => {
  //   const result = executor.run({ test: 'test' });
  //   expect(() => customer.restartTask(executor)).toThrowError('Task is already running');
  //   executor.stop();
  //   await result;
  // });

  // test('should throw error when task not found', () => {
  //   expect(() => customer.removeTask(executor)).toThrowError('Task not found');
  // });

  // Run multiple tasks
  test('should run multiple tasks', async () => {
    const executor1 = new Executor('PARA 1', testExecutorConfig);
    const executor2 = new Executor('PARA 2', testExecutorConfig);
    const executor3 = new Executor('PARA 3', testExecutorConfig);
    customer.addTask(executor1);
    customer.addTask(executor2);
    customer.addTask(executor3);

    expect(customer.getTask('0')).toBe(executor1);
    expect(customer.getTask('1')).toBe(executor2);
    expect(customer.getTask('2')).toBe(executor3);

    const result1 = customer.startTask(executor1);
    const result2 = customer.startTask(executor2);
    const result3 = customer.startTask(executor3);

    expect(await Promise.all([result1, result2, result3])).toEqual(['OK', 'OK', 'OK']);
  });

});
