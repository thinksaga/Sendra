
export interface EmailJobData {
    campaignId: string;
    leadId: string;
    stepId: string;
    workspaceId: string;
}

export const SEND_EMAIL_QUEUE = 'send-email';
