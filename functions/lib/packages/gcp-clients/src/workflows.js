"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsClient = void 0;
const workflows_1 = require("@google-cloud/workflows");
class WorkflowsClient {
    constructor(projectId, location = "us-central1") {
        this.client = new workflows_1.ExecutionsClient();
        this.projectId = projectId;
        this.location = location;
    }
    /**
     * Trigger a document processing workflow
     */
    async triggerDocumentProcessing(workflowId, input) {
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
        }
        catch (error) {
            console.error("Error triggering workflow:", error);
            throw new Error("Failed to trigger document processing workflow");
        }
    }
    /**
     * Get the status of a workflow execution
     */
    async getExecutionStatus(executionName) {
        try {
            const [execution] = await this.client.getExecution({
                name: executionName,
            });
            return {
                state: String(execution.state || "UNKNOWN"),
                result: execution.result ? JSON.parse(execution.result) : undefined,
                error: execution.error ? JSON.stringify(execution.error) : undefined,
            };
        }
        catch (error) {
            console.error("Error getting execution status:", error);
            throw new Error("Failed to get execution status");
        }
    }
}
exports.WorkflowsClient = WorkflowsClient;
