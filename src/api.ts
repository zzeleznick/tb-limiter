
export type ApiEvent = {
    ip: string; // IP address of the client
    tier: string; // "free", "pro", "enterprise", etc.
    path: string;  // /api/v2/users
    method: string; // GET, POST, PUT, DELETE, etc.
    dt: string; // ISO 8601 datetime
    ts: number; // Unix timestamp
}

export const createEvent = async (event: ApiEvent) => {
  const response = await fetch(
    "https://api.us-east.aws.tinybird.co/v0/events?name=api_usage",
    {
      method: "POST",
      body: JSON.stringify(event),
      headers: {
        Authorization:
          `Bearer ${process.env.TINYBIRD_API_KEY}`,
      },
    }
  );
  return await response.json();
};
