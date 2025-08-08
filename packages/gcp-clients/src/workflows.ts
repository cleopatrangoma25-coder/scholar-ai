import { ExecutionsClient } from "@google-cloud/workflows";

export class WorkflowsClient {
  private client: ExecutionsClient;
  private projectId: string;
  private location: string;

  constructor(projectId: string, location: string = "us-central1") {
    this.client = new ExecutionsClient();
    this.projectId = projectId;
    this.location = location;
  }

  /**
   * Trigger a document processing workflow
   */
  async triggerDocumentProcessing(workflowId: string, input: {
    paperId: string;
    storagePath: string;
    userId: string;
  }): Promise<string> {
    try {
      const parent = this.client.workflowPath(this.projectId, this.location, workflowId);
      
      const [execution] = await this.client.createExecution({
        parent,
        execution: {
          argument: JSON.stringify(input),
        },
      });

      console.log(`Created execution: ${execution.name}`);
      return execution.name || "";
    } catch (error) {
      console.error("Error triggering workflow:", error);
      throw new Error("Failed to trigger document processing workflow");
    }
  }

  /**
   * Get the status of a workflow execution
   */
  async getExecutionStatus(executionName: string): Promise<{
    state: string;
    result?: any;
    error?: any;
  }> {
    try {
      const [execution] = await this.client.getExecution({
        name: executionName,
      });

      return {
        state: String(execution.state || "UNKNOWN"),
        result: execution.result ? JSON.parse(execution.result) : undefined,
        error: execution.error ? JSON.stringify(execution.error) : undefined,
      };
    } catch (error) {
      console.error("Error getting execution status:", error);
      throw new Error("Failed to get execution status");
    }
  }
} 