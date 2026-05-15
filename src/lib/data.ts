import { supabase } from './supabase';
import { mockProjects, mockTasks, mockInboxMessages, mockIntegrations } from './mockData';
import type { Project, Task, InboxMessage, Integration } from './types';

const useMockData = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !supabase;

export async function fetchProjects(): Promise<Project[]> {
  if (useMockData || !supabase) {
    return mockProjects;
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase projects fetch failed, using mock data', error);
      return mockProjects;
    }
    return data ?? mockProjects;
  } catch (err) {
    console.warn('Supabase projects fetch threw, using mock data', err);
    return mockProjects;
  }
}

export async function fetchTasks(): Promise<Task[]> {
  if (useMockData || !supabase) {
    return mockTasks;
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase tasks fetch failed, using mock data', error);
      return mockTasks;
    }
    return data ?? mockTasks;
  } catch (err) {
    console.warn('Supabase tasks fetch threw, using mock data', err);
    return mockTasks;
  }
}

export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  if (useMockData || !supabase) {
    return mockTasks.filter((task) => task.project_id === projectId);
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase tasksByProject fetch failed, using mock data', error);
      return mockTasks.filter((task) => task.project_id === projectId);
    }
    return data ?? mockTasks.filter((task) => task.project_id === projectId);
  } catch (err) {
    console.warn('Supabase tasksByProject fetch threw, using mock data', err);
    return mockTasks.filter((task) => task.project_id === projectId);
  }
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
  if (useMockData || !supabase) {
    const task = mockTasks.find((t) => t.id === taskId);
    if (task) task.status = status;
    return;
  }

  try {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase updateTaskStatus failed, falling back to mock update', err);
    const task = mockTasks.find((t) => t.id === taskId);
    if (task) task.status = status;
  }
}

export async function fetchInboxMessages(): Promise<InboxMessage[]> {
  if (useMockData || !supabase) {
    return mockInboxMessages;
  }

  try {
    const { data, error } = await supabase
      .from('inbox_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase inbox fetch failed, using mock data', error);
      return mockInboxMessages;
    }
    return data ?? mockInboxMessages;
  } catch (err) {
    console.warn('Supabase inbox fetch threw, using mock data', err);
    return mockInboxMessages;
  }
}

export async function markMessageRead(id: string): Promise<void> {
  if (useMockData || !supabase) {
    const message = mockInboxMessages.find((msg) => msg.id === id);
    if (message) message.read = true;
    return;
  }

  try {
    const { error } = await supabase
      .from('inbox_messages')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase markMessageRead failed, falling back to mock update', err);
    const message = mockInboxMessages.find((msg) => msg.id === id);
    if (message) message.read = true;
  }
}

export async function fetchIntegrations(): Promise<Integration[]> {
  if (useMockData || !supabase) {
    return mockIntegrations;
  }

  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('Supabase integrations fetch failed, using mock data', error);
      return mockIntegrations;
    }
    return data ?? mockIntegrations;
  } catch (err) {
    console.warn('Supabase integrations fetch threw, using mock data', err);
    return mockIntegrations;
  }
}

export function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}
