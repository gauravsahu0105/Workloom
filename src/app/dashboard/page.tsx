"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Role = "ADMIN" | "MEMBER";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

type User = { id: string; email: string; name: string; role: Role };
type Project = { id: string; name: string; description?: string; _count: { tasks: number } };
type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: { id: string; name: string; email: string } | null;
};
type UserTaskCount = { userId: string; name: string; email: string; taskCount: number };

const emptyMetrics = {
  totalTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  inProgressTasks: 0,
  tasksPerUser: [] as UserTaskCount[],
};

export default function DashboardPage() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [error, setError] = useState("");

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId),
    [activeProjectId, projects]
  );

  async function callApi(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Request failed");
    return payload;
  }

  const refreshBootstrap = useCallback(async () => {
    try {
      const me = await callApi("/api/auth/me");
      setUser(me.user);
      const projectData = await callApi("/api/projects");
      setProjects(projectData.projects);
      if (!activeProjectId && projectData.projects.length > 0) {
        setActiveProjectId(projectData.projects[0].id);
      }
      const dashboardData = await callApi("/api/dashboard");
      setMetrics(dashboardData.metrics);
      setError("");
    } catch {
      setUser(null);
    }
  }, [activeProjectId]);

  const refreshTasks = useCallback(async (projectId: string) => {
    if (!projectId) return;
    const taskData = await callApi(`/api/projects/${projectId}/tasks`);
    setTasks(taskData.tasks);
  }, []);

  const refreshMembers = useCallback(async (projectId: string) => {
    if (!projectId) return;
    const memberData = await callApi(`/api/projects/${projectId}/members`);
    setProjectMembers(memberData.members);
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  useEffect(() => {
    if (activeProjectId) {
      refreshTasks(activeProjectId).catch((e) => setError(e.message));
      refreshMembers(activeProjectId).catch((e) => setError(e.message));
    }
  }, [activeProjectId, refreshMembers, refreshTasks]);

  async function onAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: Record<string, string> = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };

    if (authMode === "signup") {
      payload.name = String(form.get("name") || "");
      payload.role = String(form.get("role") || "MEMBER");
    }

    try {
      await callApi(`/api/auth/${authMode}`, { method: "POST", body: JSON.stringify(payload) });
      formElement.reset();
      await refreshBootstrap();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auth failed");
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await callApi("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("projectName") || ""),
          description: String(form.get("projectDescription") || ""),
        }),
      });
      formElement.reset();
      await refreshBootstrap();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create project");
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProjectId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await callApi(`/api/projects/${activeProjectId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: String(form.get("memberEmail") || "") }),
      });
      formElement.reset();
      await refreshMembers(activeProjectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add member");
    }
  }

  async function removeMember(memberId: string) {
    if (!activeProjectId) return;
    try {
      await callApi(`/api/projects/${activeProjectId}/members/${memberId}`, { method: "DELETE" });
      await refreshMembers(activeProjectId);
      await refreshTasks(activeProjectId);
      const dashboardData = await callApi("/api/dashboard");
      setMetrics(dashboardData.metrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove member");
    }
  }

  async function joinProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await callApi("/api/projects/join", {
        method: "POST",
        body: JSON.stringify({ projectId: String(form.get("joinProjectId") || "") }),
      });
      formElement.reset();
      await refreshBootstrap();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join project");
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProjectId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await callApi(`/api/projects/${activeProjectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: String(form.get("taskTitle") || ""),
          description: String(form.get("taskDescription") || ""),
          dueDate: form.get("taskDueDate") ? new Date(String(form.get("taskDueDate"))).toISOString() : undefined,
          priority: String(form.get("taskPriority") || "MEDIUM"),
          assigneeId: String(form.get("taskAssigneeId") || "") || undefined,
        }),
      });
      formElement.reset();
      await refreshTasks(activeProjectId);
      const dashboardData = await callApi("/api/dashboard");
      setMetrics(dashboardData.metrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create task");
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    try {
      await callApi(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refreshTasks(activeProjectId);
      const dashboardData = await callApi("/api/dashboard");
      setMetrics(dashboardData.metrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update task");
    }
  }

  async function updateTaskAssignee(taskId: string, assigneeId: string) {
    try {
      await callApi(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ assigneeId: assigneeId || null }),
      });
      await refreshTasks(activeProjectId);
      const dashboardData = await callApi("/api/dashboard");
      setMetrics(dashboardData.metrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update assignee");
    }
  }

  async function logout() {
    await callApi("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProjects([]);
    setTasks([]);
    setProjectMembers([]);
    setMetrics(emptyMetrics);
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-6 py-20">
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-8">
          <h1 className="text-2xl font-bold text-slate-100">Workloom Login</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in or create an account to access your projects.</p>
          {error && <p className="mt-4 rounded bg-rose-950/60 p-3 text-sm text-rose-200">{error}</p>}

          <form className="mt-6 space-y-3" onSubmit={onAuthSubmit}>
            {authMode === "signup" && (
              <input
                name="name"
                placeholder="Full name"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            )}
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
            {authMode === "signup" && (
              <select
                name="role"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                defaultValue="MEMBER"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            )}
            <button className="w-full rounded bg-sky-500 px-4 py-2 font-semibold text-slate-950 hover:bg-sky-400">
              {authMode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <button
            className="mt-4 text-sm text-slate-300 underline"
            onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
          >
            Switch to {authMode === "login" ? "signup" : "login"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-300">
            {user.name} ({user.role}) - {user.email}
          </p>
        </div>
        <button className="rounded border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800" onClick={logout}>
          Logout
        </button>
      </header>

      {error && <p className="mb-4 rounded bg-rose-950/60 p-3 text-sm text-rose-200">{error}</p>}

      <section className="mb-6 grid gap-3 md:grid-cols-4">
        <MetricCard label="Total Tasks" value={metrics.totalTasks} />
        <MetricCard label="In Progress" value={metrics.inProgressTasks} />
        <MetricCard label="Completed" value={metrics.completedTasks} />
        <MetricCard label="Overdue" value={metrics.overdueTasks} />
      </section>

      <section className="mb-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <h2 className="font-semibold text-slate-100">Tasks Per User</h2>
        <div className="mt-3 space-y-1 text-sm text-slate-300">
          {metrics.tasksPerUser.map((entry) => (
            <p key={entry.userId}>
              {entry.name} ({entry.email}) - {entry.taskCount}
            </p>
          ))}
          {metrics.tasksPerUser.length === 0 && <p>No assigned tasks yet.</p>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 lg:col-span-1">
          <h2 className="font-semibold text-slate-100">Projects</h2>
          <select
            value={activeProjectId}
            onChange={(e) => setActiveProjectId(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project._count.tasks} tasks)
              </option>
            ))}
          </select>

          {user.role === "ADMIN" && (
            <form className="space-y-2 border-t border-slate-800 pt-4" onSubmit={createProject}>
              <p className="text-sm font-medium text-slate-200">Create Project</p>
              <input
                name="projectName"
                placeholder="Project name"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
              <textarea
                name="projectDescription"
                placeholder="Project description"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
              <button className="w-full rounded bg-sky-500 px-4 py-2 font-semibold text-slate-950 hover:bg-sky-400">
                Create
              </button>
            </form>
          )}

          {user.role === "ADMIN" && activeProjectId && (
            <form className="space-y-2 border-t border-slate-800 pt-4" onSubmit={addMember}>
              <p className="text-sm font-medium text-slate-200">Add Member by Email</p>
              <input
                name="memberEmail"
                type="email"
                placeholder="member@example.com"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
              <button className="w-full rounded border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-800">
                Add to Project
              </button>
            </form>
          )}

          <form className="space-y-2 border-t border-slate-800 pt-4" onSubmit={joinProject}>
            <p className="text-sm font-medium text-slate-200">Join Project</p>
            <input
              name="joinProjectId"
              placeholder="Project ID"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
            <button className="w-full rounded border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-800">
              Join
            </button>
          </form>

          {activeProjectId && (
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <p className="text-sm font-medium text-slate-200">Project Members</p>
              {projectMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded border border-slate-800 p-2">
                  <p className="text-xs text-slate-300">
                    {member.name} ({member.role})
                  </p>
                  {user.role === "ADMIN" && member.id !== user.id && (
                    <button
                      type="button"
                      className="rounded border border-rose-800 px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/40"
                      onClick={() => removeMember(member.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 lg:col-span-2">
          <h2 className="font-semibold text-slate-100">Tasks {activeProject ? `- ${activeProject.name}` : ""}</h2>

          {activeProjectId && (
            <form className="grid gap-2 rounded border border-slate-800 p-3 md:grid-cols-3" onSubmit={createTask}>
              <input
                name="taskTitle"
                placeholder="Task title"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 md:col-span-1"
                disabled={user.role !== "ADMIN"}
              />
              <input
                name="taskDueDate"
                type="date"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                disabled={user.role !== "ADMIN"}
              />
              <select
                name="taskPriority"
                defaultValue="MEDIUM"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                disabled={user.role !== "ADMIN"}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
              <select
                name="taskAssigneeId"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 md:col-span-2"
                disabled={user.role !== "ADMIN"}
              >
                <option value="">Unassigned</option>
                {projectMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
              <button
                className="rounded bg-sky-500 px-4 py-2 font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={user.role !== "ADMIN"}
              >
                Add Task
              </button>
              <textarea
                name="taskDescription"
                placeholder="Description"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 md:col-span-3"
                disabled={user.role !== "ADMIN"}
              />
            </form>
          )}

          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="rounded border border-slate-800 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-slate-100">{task.title}</h3>
                  <div className="flex gap-2">
                    {user.role === "ADMIN" && (
                      <select
                        value={task.assignee?.id || ""}
                        onChange={(e) => updateTaskAssignee(task.id, e.target.value)}
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                      >
                        <option value="">Unassigned</option>
                        {projectMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="DONE">DONE</option>
                    </select>
                  </div>
                </div>
                {task.description && <p className="mt-1 text-sm text-slate-300">{task.description}</p>}
                <p className="mt-2 text-xs text-slate-400">
                  Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"} | Priority:{" "}
                  {task.priority} | Assignee: {task.assignee?.name || "Unassigned"}
                </p>
              </div>
            ))}
            {activeProjectId && tasks.length === 0 && <p className="text-sm text-slate-400">No tasks yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-100">{value}</p>
    </div>
  );
}
