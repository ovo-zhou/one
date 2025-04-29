import { NextResponse } from "next/server";
const base_url = "https://api.deepseek.com";
const apikey = process.env.deepseek_apikey;
export async function POST(request) {
  const requestParams = await request.json();
  // console.log(requestParams);
  const totalParams = {
    ...requestParams,
    frequency_penalty: 0,
    max_tokens: 2048,
    presence_penalty: 0,
    response_format: {
      type: "text",
    },
    stop: null,
    stream_options: null,
    temperature: 1,
    top_p: 1,
    tools: null,
    tool_choice: "none",
    logprobs: false,
    top_logprobs: null,
  };
  const response = await fetch(base_url + "/chat/completions", {
    method: "POST",
    body: JSON.stringify(totalParams),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apikey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          break;
        }
        const lines = new TextDecoder()
          .decode(value)
          .split("\n")
          .filter((line) => line.trim() !== "");
        for (const line of lines) {
          const data = line.replace("data: ", "");
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0].delta.content;
            if (content) {
              const encoder = new TextEncoder();
              controller.enqueue(encoder.encode(content));
            }
          } catch (error) {
            console.error("Error parsing chunk:", error);
          }
        }
      }
    },
  });
  return new NextResponse(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
