/*
  Warnings:

  - A unique constraint covering the columns `[agentName]` on the table `AgentPrompt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AgentPrompt_agentName_key" ON "AgentPrompt"("agentName");
