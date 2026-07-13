import type { WorkerEnv } from "../types";
import {
  MEDIA_BUCKET_NAME,
  classifyR2Action,
  getCurrentMonthKey,
  getR2Usage,
  toR2UsageSummary,
} from "./r2-budget";

type R2OperationGroup = {
  dimensions: {
    actionType: string;
  };
  sum: {
    requests: number;
  };
};

type R2StorageGroup = {
  max: {
    metadataSize: number;
    payloadSize: number;
  };
};

type GraphQlResponse = {
  data?: {
    viewer?: {
      accounts?: Array<{
        r2OperationsAdaptiveGroups?: R2OperationGroup[];
        r2StorageAdaptiveGroups?: R2StorageGroup[];
      }>;
    };
  };
};

function getMonthWindow(monthKey = getCurrentMonthKey()) {
  const [year, month] = monthKey.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date();

  return {
    endDate: endDate.toISOString(),
    startDate: startDate.toISOString(),
  };
}

export async function syncR2UsageFromCloudflare(env: WorkerEnv) {
  const token = env.CLOUDFLARE_ANALYTICS_TOKEN;
  const accountTag = env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountTag) {
    return {
      skipped: true,
      usage: toR2UsageSummary(await getR2Usage(env)),
    };
  }

  const monthKey = getCurrentMonthKey();
  const { startDate, endDate } = getMonthWindow(monthKey);
  const query = `
    query R2Usage($accountTag: string!, $startDate: Time!, $endDate: Time!, $bucketName: string!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          r2OperationsAdaptiveGroups(
            limit: 10000
            filter: { datetime_geq: $startDate, datetime_leq: $endDate, bucketName: $bucketName }
          ) {
            sum { requests }
            dimensions { actionType }
          }
          r2StorageAdaptiveGroups(
            limit: 1
            filter: { datetime_geq: $startDate, datetime_leq: $endDate, bucketName: $bucketName }
            orderBy: [datetime_DESC]
          ) {
            max { payloadSize metadataSize }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    body: JSON.stringify({
      query,
      variables: {
        accountTag,
        bucketName: MEDIA_BUCKET_NAME,
        endDate,
        startDate,
      },
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return {
      skipped: true,
      usage: toR2UsageSummary(await getR2Usage(env)),
    };
  }

  const payload = (await response.json()) as GraphQlResponse;
  const account = payload.data?.viewer?.accounts?.[0];
  const operationGroups = account?.r2OperationsAdaptiveGroups ?? [];
  const storageGroup = account?.r2StorageAdaptiveGroups?.[0];
  const actualStorageBytes =
    (storageGroup?.max.payloadSize ?? 0) + (storageGroup?.max.metadataSize ?? 0);

  let actualClassA = 0;
  let actualClassB = 0;

  for (const group of operationGroups) {
    const operationClass = classifyR2Action(group.dimensions.actionType);

    if (operationClass === "A") {
      actualClassA += group.sum.requests;
    }

    if (operationClass === "B") {
      actualClassB += group.sum.requests;
    }
  }

  const now = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE r2_usage_monthly
     SET
       actual_storage_bytes = ?,
       actual_class_a_used = ?,
       actual_class_b_used = ?,
       last_synced_at = ?,
       updated_at = ?
     WHERE month_key = ?`,
  )
    .bind(actualStorageBytes, actualClassA, actualClassB, now, now, monthKey)
    .run();

  await env.DB.prepare(
    `INSERT INTO r2_usage_events (
       id, month_key, bucket_name, operation_class, action_type, object_key,
       operation_count, storage_delta_bytes, status, created_at
     )
     VALUES (?, ?, ?, 'free', 'UsageSummary', NULL, 1, 0, 'synced', ?)`,
  )
    .bind(crypto.randomUUID(), monthKey, MEDIA_BUCKET_NAME, now)
    .run();

  return {
    skipped: false,
    usage: toR2UsageSummary(await getR2Usage(env)),
  };
}

