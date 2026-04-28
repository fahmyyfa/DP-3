import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const payload = await req.json();
    const datasetId = payload.resource?.defaultDatasetId;
    if (!datasetId) return new Response("No data");

    const token = Deno.env.get("APIFY_TOKEN");
    const res = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`,
    );
    const items = await res.json();

    for (const item of items) {
      await supabase.from("alumni").update({
        posisi: item.occupation,
        instansi_kerja: item.company,
        linkedin_url: item.url,
        status_pelacakan: "Berhasil Dilacak",
      }).ilike("nama", `%${item.fullName}%`);
    }

    return new Response("OK");
  } catch (err) {
    console.error(err);
    return new Response("Error");
  }
});
