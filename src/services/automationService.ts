
import { supabase } from '@/integrations/supabase/client';

export type TriggerType = 'lead_created' | 'status_changed' | 'tag_added' | 'form_submitted';
export type ActionType = 'send_email' | 'webhook' | 'create_task' | 'assign_lead';

export interface Automation {
    id: string;
    company_id?: string;
    name: string;
    trigger_type: TriggerType;
    trigger_config: Record<string, any>;
    action_type: ActionType;
    action_config: Record<string, any>; // { distribution_logic: 'round_robin' | 'random', target_users: string[] }
    is_active: boolean;
    created_at: string;
}

export interface CreateAutomationParams {
    name: string;
    trigger_type: TriggerType;
    trigger_config: Record<string, any>;
    action_type: ActionType;
    action_config: Record<string, any>;
}

export const automationService = {
    async getAutomations() {
        const { data, error } = await (supabase
            .from('automations' as any)
            .select('*')
            .order('created_at', { ascending: false }) as any);

        if (error) throw error;
        return data as Automation[];
    },

    async createAutomation(params: CreateAutomationParams) {
        const { data, error } = await (supabase
            .from('automations' as any)
            .insert({
                name: params.name,
                trigger_type: params.trigger_type,
                trigger_config: params.trigger_config,
                action_type: params.action_type,
                action_config: params.action_config,
                user_id: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single() as any);

        if (error) throw error;
        return data as Automation[];
    },

    async updateAutomation(id: string, updates: Partial<Automation>) {
        const { data, error } = await (supabase
            .from('automations' as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single() as any);

        if (error) throw error;
        return data as Automation;
    },

    async deleteAutomation(id: string) {
        const { error } = await (supabase
            .from('automations' as any)
            .delete()
            .eq('id', id) as any);

        if (error) throw error;
    },

    async toggleAutomation(id: string, currentState: boolean) {
        return this.updateAutomation(id, { is_active: !currentState });
    },

    async getIntegrationKey(serviceName: string) {
        const { data, error } = await (supabase
            .from('integration_api_keys' as any)
            .select('api_key')
            .eq('service_name', serviceName)
            .eq('is_active', true)
            .single() as any);

        if (error || !data) return null;
        return data.api_key;
    },

    async checkAndRunAutomations(triggerType: TriggerType, data: any) {
        // 1. Fetch active automations for this trigger
        const { data: automations, error } = await (supabase
            .from('automations' as any)
            .select('*')
            .eq('trigger_type', triggerType)
            .eq('is_active', true) as any);

        if (error) {
            console.error('Failed to fetch automations', error);
            return;
        }



        // 2. Filter and Execute
        for (const auto of automations as Automation[]) {
            if (this.shouldRun(auto, data)) {
                await this.executeAction(auto, data);
            }
        }
    },

    shouldRun(auto: Automation, data: any): boolean {
        if (auto.trigger_type === 'lead_created') {
            return true;
        }
        if (auto.trigger_type === 'status_changed') {
            const toStatus = auto.trigger_config?.to_status;
            if (toStatus && data.status === toStatus) {
                return true;
            }
            return false;
        }
        return false;
    },

    async executeAction(auto: Automation, data: any) {

        const logEntry = {
            automation_id: auto.id,
            status: 'pending',
            logs: `Started at ${new Date().toISOString()}`
        };

        // Create initial log
        const { data: logData, error: logError } = await (supabase
            .from('automation_logs' as any)
            .insert(logEntry)
            .select()
            .single() as any);

        if (logError) console.error('Failed to create log', logError);

        try {
            if (auto.action_type === 'send_email') {

                // TODO: Real email sending logic
            } else if (auto.action_type === 'webhook') {
                if (auto.action_config?.url) {
                    await fetch(auto.action_config.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                }
            } else if (auto.action_type === 'whatsapp' as any) {
                const apiKey = await this.getIntegrationKey('whatsapp');
                if (!apiKey) {
                    throw new Error('WhatsApp integration not connected');
                }
                const message = auto.action_config?.template?.replace('{{name}}', data.name || 'User');

                // Simulate API call
            }

            if (logData) {
                await (supabase.from('automation_logs' as any).update({ status: 'success', logs: 'Completed successfully' }).eq('id', logData.id) as any);
            }

        } catch (err: any) {
            console.error('Automation failed', err);
            if (logData) {
                await (supabase.from('automation_logs' as any).update({ status: 'failed', logs: `Error: ${err.message}` }).eq('id', logData.id) as any);
            }
        }
    }
};
