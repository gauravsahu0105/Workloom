export const ROLES = ["ADMIN", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];
export const ADMIN_ROLE: Role = "ADMIN";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const DONE_STATUS: TaskStatus = "DONE";
export const IN_PROGRESS_STATUS: TaskStatus = "IN_PROGRESS";

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
