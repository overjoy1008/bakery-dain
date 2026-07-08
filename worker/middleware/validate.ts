import { z } from "zod";
import { HttpError } from "../utils/http-error";

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "VALIDATION_ERROR", "요청 본문을 확인해 주세요.");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, "VALIDATION_ERROR", "입력값을 확인해 주세요.", {
      issues: result.error.issues,
    });
  }

  return result.data;
}
