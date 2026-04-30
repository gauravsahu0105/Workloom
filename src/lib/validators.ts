import { z } from "zod";
import { ROLES, TASK_PRIORITIES, TASK_STATUSES } from "./types";

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(120),
  role: z.enum(ROLES),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(120),
});

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(600).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

export const updateTaskSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const joinProjectSchema = z.object({
  projectId: z.string().min(1),
});
