import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { query } = await req.json();
    const apiKey = Deno.env.get("SERP_API_KEY");

    if (!apiKey) throw new Error("API Key tidak ditemukan di server Secrets");

    const response = await fetch(
      `https://serpapi.com/search.json?q=${
        encodeURIComponent(query)
      }&api_key=${apiKey}&engine=google`,
    );
    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
});
