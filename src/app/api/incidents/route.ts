import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  noStore();
  try {
    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("🚨 GET /api/incidents Supabase Error:", error);
      } else if (data) {
        return NextResponse.json(
          { incidents: data },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        );
      }
    }

    // Return mock store if Supabase not configured or empty
    const incidents = getMockStore();
    return NextResponse.json(
      { incidents },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch incidents:", error);
    return NextResponse.json({ incidents: getMockStore() });
  }
}
