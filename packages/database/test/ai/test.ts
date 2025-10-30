import { describe, expect, test, afterAll } from "@jest/globals";
import {  createAgentPrompt,deleteAgentPrompt, getAgentPrompt, getAgentPromptByAgentName, updateAgentPrompt } from "../../src/ai/prompt";
describe("agent 提示词测试", () => {
  let id: number | null = null
  test("创建一个新的提示词", async () => {
    const prompt = await createAgentPrompt({
      agentName: "test",
      prompt: "你是一个测试提示词"
    })
    id = prompt.id
    expect(prompt).toHaveProperty('id')
  });
  test("获取所有提示词", async () => {
    const prompts = await getAgentPrompt();
    expect(Array.isArray(prompts)).toBe(true);
  });
  test("根据agentName获取提示词", async () => {
    const prompts = await getAgentPromptByAgentName("test");
    expect(prompts).toHaveProperty('id')
  });
  test("更新提示词", async () => {
    if (id){
      const updated = await updateAgentPrompt({
        id,
        agentName: "test",
        prompt: "你是一个更新后的测试提示词"
      });
      expect(updated.prompt).toBe("你是一个更新后的测试提示词");
    }
  });
  afterAll(async () => {
    // 清理测试数据
    if (id !== null)
    await deleteAgentPrompt(id);
  });
});
