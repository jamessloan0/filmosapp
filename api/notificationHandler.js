import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const { event: evt, data, old_data } = body;

    const entityName = evt?.entity_name;
    const eventType  = evt?.type;

    if (!entityName || !eventType || !data) {
      return res.status(200).json({ skipped: 'missing payload' });
    }

    const getProject = async (projectId) => {
      const { data: rows } = await supabase.from('projects').select('*').eq('id', projectId);
      return rows?.[0] || null;
    };

    const getSettings = async (projectId, ownerEmail) => {
      const { data: rows } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_email', ownerEmail);
      return rows?.[0] || null;
    };

    const createNotification = async (project, type, title, bodyText) => {
      await supabase.from('notifications').insert({
        project_id:      project.id,
        project_name:    project.name,
        type,
        title,
        body:            bodyText || '',
        read:            false,
        recipient_email: project.owner_email,
      });
    };

    // Message created by client
    if (entityName === 'Message' && eventType === 'create') {
      if (data.sender_type !== 'client') {
        return res.status(200).json({ skipped: 'filmmaker message' });
      }
      const project = await getProject(data.project_id);
      if (!project) return res.status(200).json({ skipped: 'project not found' });

      const settings = await getSettings(data.project_id, project.owner_email);
      if (settings?.notify_on_message === false) {
        return res.status(200).json({ skipped: 'disabled' });
      }
      await createNotification(project, 'message',
        `New message from ${data.sender_name}`,
        data.content?.substring(0, 120)
      );
    }

    // Feedback decision changed
    else if (entityName === 'Feedback' && eventType === 'update') {
      const wasChanged = old_data?.decision === 'pending' && data.decision && data.decision !== 'pending';
      if (!wasChanged) return res.status(200).json({ skipped: 'no decision change' });

      const project = await getProject(data.project_id);
      if (!project) return res.status(200).json({ skipped: 'project not found' });

      const settings = await getSettings(data.project_id, project.owner_email);
      if (settings?.notify_on_feedback === false) {
        return res.status(200).json({ skipped: 'disabled' });
      }
      const verb = data.decision === 'approved' ? 'approved' : 'requested changes on';
      await createNotification(project, 'feedback',
        `${data.client_name || 'Client'} ${verb} "${data.title}"`,
        data.client_note || ''
      );
    }

    // Proposal status changed by client
    else if (entityName === 'Proposal' && eventType === 'update') {
      const clientStatuses = ['approved', 'changes_requested'];
      const wasClientResponse = old_data?.status === 'sent' && clientStatuses.includes(data.status);
      if (!wasClientResponse) return res.status(200).json({ skipped: 'not client response' });

      const project = await getProject(data.project_id);
      if (!project) return res.status(200).json({ skipped: 'project not found' });

      const settings = await getSettings(data.project_id, project.owner_email);
      if (settings?.notify_on_proposal === false) {
        return res.status(200).json({ skipped: 'disabled' });
      }
      const verb = data.status === 'approved' ? 'approved' : 'requested changes on';
      await createNotification(project, 'proposal',
        `${data.client_name || 'Client'} ${verb} proposal "${data.title}"`,
        data.client_decision || ''
      );
    }

    else {
      return res.status(200).json({ skipped: `unhandled: ${entityName} ${eventType}` });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('notificationHandler error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
