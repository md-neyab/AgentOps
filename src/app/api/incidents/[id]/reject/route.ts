import { NextRequest, NextResponse } from "next/server";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const now = new Date().toISOString();

    if (isServerSupabaseConfigured()) {
      await supabaseAdmin
        .from("incidents")
        .update({
          status: "rejected",
          rejected_at: now,
          updated_at: now,
        })
        .eq("id", id);
    }

    const store = getMockStore();
    const idx = store.findIndex((item) => item.id === id);
    if (idx !== -1) {
      store[idx] = {
        ...store[idx],
        status: "rejected",
        rejected_at: now,
        updated_at: now,
      };
    }

    return NextResponse.json({
      success: true,
      status: "rejected",
      rejected_at: now,
    });
  } catch (error) {
    console.error("Failed to reject incident:", error);
    return NextResponse.json(
      { error: "Failed to reject incident." },
      { status: 500 }
    );
  }
}

