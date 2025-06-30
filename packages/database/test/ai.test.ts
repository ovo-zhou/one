const  ai=require('../dist/ai');
test("添加消息",async () => {
  const data=await ai.createMessage({
    conversationId:1,
    role: 'user',
    content: 'Hello, world!' 
  });
  expect(data).toEqual({
    conversationId: 1,
    role: "user",
    content: "Hello, world!",
  });
});
