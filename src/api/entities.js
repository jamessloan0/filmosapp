/**
 * Supabase entity layer — drop-in replacement for base44.entities.*
 * Mirrors the filter/create/update/delete/list API used throughout the app.
 */
import { supabase } from './supabaseClient';

function buildQuery(table, filters = {}, order = null) {
  let query = supabase.from(table).select('*');

  for (const [key, value] of Object.entries(filters)) {
    if (value === null) {
      query = query.is(key, null);
    } else if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  }

  if (order) {
    const desc = order.startsWith('-');
    const col = desc ? order.slice(1) : order;
    query = query.order(col, { ascending: !desc });
  }

  return query;
}

function entity(table) {
  return {
    async filter(filters = {}, order = null) {
      const { data, error } = await buildQuery(table, filters, order);
      if (error) throw error;
      return data || [];
    },

    async list(order = null) {
      const { data, error } = await buildQuery(table, {}, order);
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async create(record) {
      const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // Realtime subscription — mirrors base44.entities.X.subscribe()
    subscribe(callback) {
      const channel = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          callback({
            type: payload.eventType, // 'INSERT' | 'UPDATE' | 'DELETE'
            data: payload.new,
            old_data: payload.old,
          });
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    },
  };
}

export const entities = {
  Project:              entity('projects'),
  ProjectFile:          entity('project_files'),
  Message:              entity('messages'),
  Invoice:              entity('invoices'),
  Activity:             entity('activities'),
  Feedback:             entity('feedback'),
  Proposal:             entity('proposals'),
  Notification:         entity('notifications'),
  NotificationSettings: entity('notification_settings'),
  PendingTester:        entity('pending_testers'),
  User:                 entity('users'),
  VideoComment:         entity('video_comments'),
};
