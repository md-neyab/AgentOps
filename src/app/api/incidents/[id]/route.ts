import { NextRequest, NextResponse } from "next/server";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("incidents")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return NextResponse.json({ incident: data });
      }
    }

    const mockIncident = getMockStore().find((item) => item.id === id);
    if (mockIncident) {
      return NextResponse.json({ incident: mockIncident });
    }

    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to fetch incident:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

