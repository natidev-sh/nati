/**
 * Support ticket integration for desktop app
 * Submits tickets to nati.dev support system
 */

import { ChatLogsData } from "@/ipc/ipc_types";

interface TicketSubmission {
  subject: string;
  description: string;
  category: 'bug_report' | 'feature_request' | 'technical_support' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  desktopLogsUrl?: string;
  systemInfo?: any;
}

export class SupportTicketClient {
  private static SUPPORT_API_URL = 'https://nati.dev/api/support/submit';
  
  /**
   * Submit a support ticket from the desktop app
   */
  static async submitTicket(
    ticket: TicketSubmission,
    accessToken?: string
  ): Promise<{ success: boolean; ticketNumber?: number; error?: string }> {
    try {
      const response = await fetch(this.SUPPORT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          ...ticket,
          source: 'desktop'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        ticketNumber: data.ticket_number
      };
    } catch (error) {
      console.error('Failed to submit support ticket:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload chat logs and create a support ticket in one go
   */
  static async submitTicketWithLogs(
    chatLogsData: ChatLogsData,
    {
      subject,
      description,
      category = 'bug_report',
      priority = 'medium',
      accessToken
    }: {
      subject: string;
      description: string;
      category?: TicketSubmission['category'];
      priority?: TicketSubmission['priority'];
      accessToken?: string;
    }
  ): Promise<{ success: boolean; ticketNumber?: number; logsUrl?: string; error?: string }> {
    try {
      // First, upload the logs
      const logsUploadResult = await this.uploadChatLogs(chatLogsData);
      
      if (!logsUploadResult.success) {
        return {
          success: false,
          error: `Failed to upload logs: ${logsUploadResult.error}`
        };
      }

      // Then create the ticket with the logs URL
      const ticketResult = await this.submitTicket(
        {
          subject,
          description,
          category,
          priority,
          desktopLogsUrl: logsUploadResult.logsUrl,
          systemInfo: chatLogsData.debugInfo
        },
        accessToken
      );

      return {
        ...ticketResult,
        logsUrl: logsUploadResult.logsUrl
      };
    } catch (error) {
      console.error('Failed to submit ticket with logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload chat logs to storage
   */
  private static async uploadChatLogs(
    chatLogsData: ChatLogsData
  ): Promise<{ success: boolean; logsUrl?: string; error?: string }> {
    try {
      const chatLogsJson = {
        systemInfo: chatLogsData.debugInfo,
        chat: chatLogsData.chat,
        codebaseSnippet: chatLogsData.codebase,
      };

      // Get signed URL from upload service
      const response = await fetch(
        "https://upload-logs.dyad.sh/generate-upload-url",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            extension: "json",
            contentType: "application/json",
          }),
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get upload URL: ${response.statusText}`
        };
      }

      const { uploadUrl, filename } = await response.json();

      // Upload the logs
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatLogsJson),
      });

      if (!uploadResponse.ok) {
        return {
          success: false,
          error: `Failed to upload logs: ${uploadResponse.statusText}`
        };
      }

      // Construct the public URL
      const logsUrl = `https://upload-logs.dyad.sh/${filename}`;

      return {
        success: true,
        logsUrl
      };
    } catch (error) {
      console.error('Failed to upload chat logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
