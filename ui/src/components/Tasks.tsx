import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  TextField,
  Toolbar,
} from "@mui/material";
import { useApi, useTasks } from "./AppContext";
import { Task } from "@/Api";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";

import PlayIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

type AlertMessage = {
  id: number;
  message: string;
  type: "info" | "error";
};

const socket = io("http://localhost:3333/", {
  transports: ["websocket"],
  upgrade: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  autoConnect: true,
  timeout: 20000,
});

const TaskField = ({
  onSubmit,
  value,
  onChange,
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
    >
      <TextField
        defaultValue={value}
        onChange={onChange}
        focused
        size="small"
        label="New task name"
      />
    </form>
  );
};

export const Tasks = () => {
  const [alerts, setAlerts] = useState([] as AlertMessage[]);
  const [newTaskName, setNewTaskName] = useState("New Task 1");

  let alertId = 0;
  const addAlert = useCallback(
    (message: string, type: "info" | "error" = "info") => {
      const id = alertId++;
      const a = [...alerts, { id, message, type }];
      setAlerts(a);
      if (type !== "error") {
        setTimeout(() => {
          setAlerts(alerts.filter((a) => id === a.id));
        }, 5000);
      }
    },
    [alertId, alerts]
  );

  const api = useApi();
  const {
    tasks,
    completedTasks,
    addTask,
    loadTasks,
    loadCompletedTasks,
    updateTask,
    removeTask,
  } = useTasks();

  const handleLoadTasks = useCallback(() => {
    Promise.all([loadTasks(), loadCompletedTasks()]);
  }, [loadTasks, loadCompletedTasks]);

  useEffect(() => {
    socket.on("message", async (event: any, v: any) => {
      updateTask(v.task.id, v.task);
      if (event === "done") {
        addAlert(`Task ${v.task.name} done`, "info");
        handleLoadTasks();
      }
      if (event === "stop") {
        addAlert(`Task ${v.task.name} stop`, "info");
        handleLoadTasks();
      }
      if (event === "error") {
        addAlert(`Task ${v.task.name} error: ${v.error}`, "error");
        handleLoadTasks();
      }
    });
  }, [addAlert, handleLoadTasks, updateTask]);

  const handleAddTask = async (
    event: React.MouseEvent<HTMLButtonElement> | FormEvent<HTMLFormElement>
  ) => {
    const task = {
      name: newTaskName || "New Task",
    };
    const res = await addTask(task);
    if (res.status === "OK") {
      handleLoadTasks();
    } else {
      addAlert(res.error, "error");
    }
  };

  const handleStartTask = async (task: Task) => {
    try {
      if (!task.id) {
        const ret = await addTask(task);
        if (ret.status !== "OK") {
          addAlert(ret.error, "error");
          return;
        }
        console.log("Task added", task, ret.task);
        task = ret.task;
      }
      const res = task.isRunning
        ? await api.stopTask(task.id)
        : await api.startTask(task.id);

      if (res.status === "OK") {
        // addAlert('Task started', 'info');
      } else {
        addAlert(res.error, "error");
        return;
      }
    } catch (error) {
      addAlert(error as string, "error");
    }
    handleLoadTasks();
  };

  const handleRemoveTask = async (task: Task) => {
    try {
      if (task.id) {
        const res = await api.removeTask(task.id);
        if (res.status === "OK") {
          addAlert("Task removed", "info");
        } else {
          addAlert(res.error, "error");
        }
      } else {
        addAlert("Task not found", "error");
      }
    } catch (error: any) {
      addAlert(error, "error");
    }
    handleLoadTasks();
  };

  return (
    <>
      <Stack spacing={2}>
        {alerts.map((alert: AlertMessage) => {
          return (
            <Alert
              key={alert.id}
              variant="standard"
              severity={alert.type}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlerts(alerts.filter((a) => a !== alert));
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {alert.message}
            </Alert>
          );
        })}
      </Stack>

      <List>
        <Toolbar>
          <Stack spacing={1} direction="row" flex="1">
            <TaskField
              onSubmit={handleAddTask}
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />

            <Button onClick={handleAddTask} variant="contained" color="primary">
              Add Task
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              onClick={handleLoadTasks}
              variant="contained"
              color="primary"
            >
              Reload Tasks
            </Button>
          </Stack>
        </Toolbar>

        <ListSubheader>Tasks</ListSubheader>

        {tasks?.map((task: Task) => {
          return (
            <ListItem key={task.id}>
              <ListItemAvatar>{task?.id}</ListItemAvatar>
              <ListItemIcon sx={{ position: 'relative' }}>
                <CircularProgress
                  variant="determinate"
                  value={Math.round((task?.progress || 0) * 100)}
                />
                <Box
                  sx={{
                    position: "absolute",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconButton onClick={() => handleStartTask(task)}>
                    {task.isRunning ? <StopIcon /> : <PlayIcon />}
                  </IconButton>
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={task.name}
                secondary={
                  task.exitState
                    ? `${task.exitState?.state}: ${task.exitState?.message}`
                    : ""
                }
              />
              <ListItemAvatar sx={{ textAlign: "end" }}>
                {Math.round((task?.progress || 0) * 100)}%
              </ListItemAvatar>
              <ListItemIcon>
                <IconButton onClick={() => handleRemoveTask(task)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemIcon>
            </ListItem>
          );
        })}

        <ListSubheader>Completed Tasks</ListSubheader>

        {completedTasks?.map((task: Task) => {
          return (
            <ListItem key={task.id}>
              <ListItemAvatar>{task?.id}</ListItemAvatar>
              <ListItemIcon>
                <IconButton
                  onClick={() =>
                    handleStartTask({
                      name: `${task.name} RESTARTED`,
                    })
                  }
                >
                  {task.isRunning ? <StopIcon /> : <PlayIcon />}
                </IconButton>
              </ListItemIcon>
              <ListItemText
                primary={task.name}
                secondary={`${task.exitState?.state}: ${task.exitState?.message}`}
              />
              <ListItemAvatar sx={{ textAlign: "end" }}>
                {Math.round((task?.progress || 0) * 100)}%
              </ListItemAvatar>
              <ListItemIcon>
                <IconButton onClick={() => handleRemoveTask(task)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemIcon>
            </ListItem>
          );
        })}

        {/* <pre>Tasks: {JSON.stringify(tasks, null, 2)}</pre> */}
        {/* <pre>Completed: {JSON.stringify(completedTasks, null, 2)}</pre> */}
      </List>
    </>
  );
};
