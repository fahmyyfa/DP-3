import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (req) => {
  console.log("LOG BARU AKTIF: Webhook Received!");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const payload = await req.json();
    console.log("Payload Masuk:", JSON.stringify(payload));

    const datasetId = payload.resource?.defaultDatasetId;
    if (!datasetId) {
      console.log("Dataset ID kosong (Test Webhook).");
      return new Response(JSON.stringify({ message: "No dataset ID" }), {
        status: 200,
      });
    }

    const apifyUrl =
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${
        Deno.env.get("APIFY_TOKEN")
      }`;
    const response = await fetch(apifyUrl);
    const items = await response.json();

    console.log(`Memproses ${items.length} data alumni...`);

    for (const item of items) {
      const { fullName, occupation, location, education } = item;

      const isUMM = education?.some((edu: any) =>
        (edu.schoolName?.toLowerCase().includes("muhammadiyah malang") ||
          edu.schoolName?.toLowerCase().includes("umm")) &&
        parseInt(edu.endYear || "0") <= 2025
      );

      if (isUMM) {
        console.log(`Updating database: ${fullName}`);
        const { error } = await supabase
          .from("alumni")
          .update({
            posisi: occupation,
            alamat_kerja: location,
            status_pelacakan: "Teridentifikasi (Apify)",
            found_count: 8,
          })
          .ilike("nama", `%${fullName}%`);

        if (error) console.error("Update Error:", error.message);
      }
    }

    return new Response(JSON.stringify({ message: "Success" }), {
      status: 200,
    });
  } catch (err: any) {
    console.error("Fatal Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
