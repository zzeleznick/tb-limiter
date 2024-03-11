export type ApiEvent = {
  ip: string; // IP address of the client
  tier: string; // "free", "pro", "enterprise", etc.
  path: string; // /api/v2/users
  method: string; // GET, POST, PUT, DELETE, etc.
  dt: string; // ISO 8601 datetime
  ts: number; // Unix timestamp
};

export type HitCountResponse = {
  data: {
    ct: number;
  }[];
};

export const postEvent = async (event: ApiEvent) => {
  const response = await fetch(
    "https://api.us-east.aws.tinybird.co/v0/events?name=v2_api_usage",
    {
      method: "POST",
      body: JSON.stringify(event),
      headers: {
        Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}`,
      },
    }
  );
  return await response.json();
};

export const getHitCount = async (ip: string, lookback_sec = 60) => {
  const response = await fetch(
    `https://api.us-east.aws.tinybird.co/v0/pipes/last_hits_ct.json?ip=${ip}&lookback_sec=${lookback_sec}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}`,
      },
    }
  );
  const resp = (await response.json()) as HitCountResponse;
  const { data } = resp;
  //   console.log(`getHitCount: ${JSON.stringify(data)}`);
  const count = data[0]?.ct || 0;
  return count;
};
