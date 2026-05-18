export type SseEvent = {
  event: string;
  data: unknown;
};

export const parseSseSegment = (segment: string): SseEvent | null => {
  const lines = segment.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  });

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join("\n");

  if (!rawData || rawData === "[DONE]") {
    return null;
  }

  try {
    return {
      event,
      data: JSON.parse(rawData),
    };
  } catch {
    return null;
  }
};

export const readSseStream = async (
  response: Response,
  onEvent: (event: SseEvent) => void | Promise<void>,
): Promise<void> => {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const segments = buffer.split(/\r?\n\r?\n/);
    buffer = segments.pop() ?? "";

    for (const segment of segments) {
      const parsed = parseSseSegment(segment);

      if (parsed) {
        await onEvent(parsed);
      }
    }
  }
};
