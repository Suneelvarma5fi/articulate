import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: { action: "approve" | "reject"; rejectionReason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, rejectionReason } = body;

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    status: action === "approve" ? "approved" : "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: userId,
  };

  if (action === "reject" && rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  const { data: submission, error } = await supabaseAdmin
    .from("challenge_submissions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to review submission" },
      { status: 500 }
    );
  }

  return NextResponse.json({ submission });
}
