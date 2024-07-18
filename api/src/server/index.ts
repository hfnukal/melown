import express, { Application } from 'express';
import { Customer } from '../Customer';
import { Executor } from '../Executor';
import cors from 'cors';
import http from 'http';
import { Server } from "socket.io";

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const swaggerOptions = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Melown API',
      version: '1.0.0',
    },
  },
  apis: ['./src/server/index.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const corsOptions = {
  // origin: 'http://localhost:3000',
  origin: '*',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}

const app = express();
app.use(cors(corsOptions));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});


// API for Custommer class
//  - POST /tasks - Add task
//  - POST /tasks/:id/start - Start task
//  - POST /tasks/:id/stop - Stop task
//  - POST /tasks/:id/restart - Restart task
//  - POST /tasks/:id/remove - Remove task
//  - GET /tasks - Get tasks
//  - GET /tasks/:id - Get task
//  - GET /tasks/:id/status - Get task status
//  - GET /tasks/:id/progress - Get task progress
//  - GET /tasks/:id/result - Get task result

const customer = new Customer();

customer.on('progress', (data: any) => {
  io.send('progress', data);
});
customer.on('start', (data: any) => {
  io.send('start', data);
});
customer.on('stop', (data: any) => {
  io.send('stop', data);
});
customer.on('error', (data: any) => {
  io.send('error', data);
});
customer.on('done', (data: any) => {
  io.send('done', data);
});

app.use(express.json());

/**
 * @swagger
 * /tasks:
 *  post:
 *   summary: Create a new task
 *   description: Adds a new task to the system.
 *   requestBody:
 *     description: Task data
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - config
 *           properties:
 *             name:
 *               type: string
 *               description: Name of the task.
 *             config:
 *               type: object
 *               additionalProperties: true
 *               description: Configuration for the task. Replace 'object' with a more specific type if possible.
 *   responses:
 *     '200':
 *       description: Task successfully created.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - OK
 *                 description: Indicates the request was successful.
 *     '500':
 *       description: Error in creating the task.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - ERROR
 *                 description: Indicates there was an error processing the request.
 *               error:
 *                 type: string
 *                 description: Error message detailing what went wrong.
 */
app.post('/tasks', (req: express.Request, res: express.Response) => {
  try {
    interface TaskRequestBody {
      name: string;
      config: any; // Replace 'any' with the appropriate type for the 'config' property
    }

    const { name, config }: TaskRequestBody = req.body;
    const executor = new Executor(name, config);
    customer.addTask(executor);
    res.json({
      status: 'OK',
      task: {
        id: executor.id,
        name: executor.name,
        progress: executor.progress,
        isRunning: executor.isRunning,
        exitState: executor.exitState
      },
    });
  } catch (error) {
    res.json({
      status: 'ERROR',
      error: error,
    });
  }
});


/**
 * @swagger
 * /tasks/{id}/start:
 *  post:
 *    summary: Start a specific task
 *    description: Initiates the execution of a task identified by its ID.
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *        description: The ID of the task to start.
 *    requestBody:
 *      description: Optional data to start the task with.
 *      required: false
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            description: Replace 'object' with a more specific type if the task requires input parameters.
 *    responses:
 *      '200':
 *        description: Task successfully started.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  enum:
 *                    - OK
 *                  description: Indicates the task was successfully started.
 *                result:
 *                  type: object
 *                  description: The result of starting the task. Replace 'object' with a more specific type if applicable.
 *      '400':
 *        description: Invalid task ID provided.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  enum:
 *                    - ERROR
 *                  description: Indicates an error due to invalid input.
 *                error:
 *                  type: string
 *                  description: Error message detailing what went wrong.
 *      '500':
 *        description: Error in starting the task.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  enum:
 *                    - ERROR
 *                  description: Indicates there was an error processing the request.
 *                error:
 *                  type: string
 *                  description: Error message detailing what went wrong.
 */
app.post('/tasks/:id/start', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const task = customer.getTask(id);
    const result = customer.startTask(task);
    res.json({ status: 'OK', result });
    await result;
  } catch (error) {
    res.json({ status: 'ERROR', error: error });
  }
});

/**
 * @swagger
 *   /tasks/{id}/stop:
 *     post:
 *       summary: Stop a specific task
 *       description: Stops the execution of a task identified by its ID.
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: The ID of the task to stop.
 *       responses:
 *         '200':
 *           description: Task successfully stopped.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - OK
 *                     description: Indicates the task was successfully stopped.
 *         '500':
 *           description: Error in stopping the task.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates there was an error processing the request.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 */
app.post('/tasks/:id/stop', (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const task = customer.getTask(id);
    customer.stopTask(task);
    res.json({ status: 'OK' });
  } catch (error) {
    res.json({ status: 'ERROR', error: error });
  }
});

/**
 * @swagger
 * paths:
 *   /tasks/{id}/restart:
 *     post:
 *       summary: Restart a specific task
 *       description: Restarts the execution of a task identified by its ID.
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: The ID of the task to restart.
 *       requestBody:
 *         description: Optional data to restart the task with.
 *         required: false
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Replace 'object' with a more specific type if the task requires input parameters.
 *       responses:
 *         '200':
 *           description: Task successfully restarted.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - OK
 *                     description: Indicates the task was successfully restarted.
 *                   result:
 *                     type: object
 *                     description: The result of restarting the task. Replace 'object' with a more specific type if applicable.
 *         '400':
 *           description: Invalid task ID provided.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates an error due to invalid input.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 *         '500':
 *           description: Error in restarting the task.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates there was an error processing the request.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 */
app.post('/tasks/:id/restart', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const task = customer.getTask(id);
    const result = customer.restartTask(task);
    res.json({ status: 'OK', result });
    await result;
  } catch (error) {
    res.json({ status: 'ERROR', error: error });
  }
});

/**
 * @swagger
 * paths:
 *   /tasks/{id}:
 *     delete:
 *       summary: Delete a specific task
 *       description: Deletes a task identified by its ID from the system.
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: The ID of the task to delete.
 *       responses:
 *         '200':
 *           description: Task successfully deleted.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - OK
 *                     description: Indicates the task was successfully deleted.
 *         '404':
 *           description: Task not found.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates the specified task does not exist.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 *         '500':
 *           description: Error in deleting the task.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates there was an error processing the request.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 */
app.delete('/tasks/:id', (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const task = customer.getTask(id);
    customer.removeTask(task);
    res.json({ status: 'OK' });
  } catch (error) {
    console.log('ERROR DELETE tasks', error);
    res.json({ status: 'ERROR', error: error?.toString() });
  }
});

/**
 * @swagger
 * paths:
 *   /tasks:
 *     get:
 *       summary: Retrieve all tasks
 *       description: Returns a list of all tasks in the system.
 *       responses:
 *         '200':
 *           description: A list of tasks successfully retrieved.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - OK
 *                     description: Indicates the request was successful.
 *                   tasks:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: The unique identifier of the task.
 *                         name:
 *                           type: string
 *                           description: The name of the task.
 *                         progress:
 *                           type: number
 *                           format: float
 *                           description: The progress of the task as a percentage.
 *                         isRunning:
 *                           type: boolean
 *                           description: Whether the task is currently running.
 *         '500':
 *           description: Error retrieving the tasks.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates there was an error processing the request.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 */
app.get('/tasks', (req: express.Request, res: express.Response) => {
  try {
    // res.json({ status: 'OK', tasks: customer.tasks.map((t, i) => ({ ...t, id: i })) });
    res.json({ status: 'OK', tasks: customer.tasks.map(t => ({
      id: t.id,
      name: t.name,
      progress: t.progress,
      isRunning: t.isRunning,
      exitState: t.exitState,
    })) });
  } catch (error) {
    console.log('ERROR GET tasks', error);
    res.json({ status: 'ERROR', error: error });
  }
});

/**
 * @swagger
 * paths:
 *   /completedTasks:
 *     get:
 *       summary: Retrieve all completed tasks
 *       description: Returns a list of all tasks that have been completed in the system.
 *       responses:
 *         '200':
 *           description: A list of completed tasks successfully retrieved.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - OK
 *                     description: Indicates the request was successful.
 *                   tasks:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: The unique identifier of the task.
 *                         name:
 *                           type: string
 *                           description: The name of the task.
 *                         progress:
 *                           type: number
 *                           format: float
 *                           description: The progress of the task, should be 100 for completed tasks.
 *                         isRunning:
 *                           type: boolean
 *                           description: Whether the task is currently running, should be false for completed tasks.
 *         '500':
 *           description: Error retrieving the completed tasks.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates there was an error processing the request.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 */
app.get('/completedTasks', (req: express.Request, res: express.Response) => {
  try {
    res.json({ status: 'OK', tasks: customer.completedTasks
      .map(t => ({
        id: t.id,
        name: t.name,
        progress: t.progress,
        isRunning: t.isRunning,
        exitState: t.exitState,
      }))
    });
  } catch (error) {
    res.json({ status: 'ERROR', error: error });
  }
});

app.get('/tasks/:id', (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const task = customer.getTask(id);
    res.json({ status: 'OK', task });
  } catch (error) {
    res.json({ status: 'ERROR', error: error });
  }
});

/**
 * @swagger
 * paths:
 *   /tasks/{id}:
 *     get:
 *       summary: Retrieve a specific task by ID
 *       description: Returns details of a specific task identified by its ID.
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: The unique identifier of the task.
 *       responses:
 *         '200':
 *           description: Task details successfully retrieved.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - OK
 *                     description: Indicates the request was successful.
 *                   task:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The unique identifier of the task.
 *                       name:
 *                         type: string
 *                         description: The name of the task.
 *                       progress:
 *                         type: number
 *                         format: float
 *                         description: The progress of the task as a percentage.
 *                       isRunning:
 *                         type: boolean
 *                         description: Whether the task is currently running.
 *         '404':
 *           description: Task not found.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates the specified task does not exist.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 *         '500':
 *           description: Error retrieving the task.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates there was an error processing the request.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 */
app.get('/tasks/:id/status', (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const task = customer.getTask(id);
    res.json({ status: 'OK', isRunning: task.isRunning });
  } catch (error) {
    res.json({ status: 'ERROR', error: error });
  }
});

/**
 * @swagger
 * paths:
 *   /tasks/{id}/progress:
 *     get:
 *       summary: Get the progress of a specific task
 *       description: Returns the progress of a task identified by its ID.
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *           description: The ID of the task whose progress is being queried.
 *       responses:
 *         '200':
 *           description: Task progress successfully retrieved.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - OK
 *                     description: Indicates the request was successful.
 *                   progress:
 *                     type: number
 *                     format: float
 *                     description: The current progress of the task as a percentage.
 *         '404':
 *           description: Task not found.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates the specified task does not exist.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 *         '500':
 *           description: Error retrieving the task progress.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - ERROR
 *                     description: Indicates there was an error processing the request.
 *                   error:
 *                     type: string
 *                     description: Error message detailing what went wrong.
 */
app.get('/tasks/:id/progress', (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const task = customer.getTask(id);
    res.json({ status: 'OK', progress: task.progress });
  } catch (error) {
    res.json({ status: 'ERROR', error: error });
  }
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
