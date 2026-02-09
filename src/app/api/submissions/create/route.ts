import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title: string;
    referenceImageUrl: string;
    categories: string[];
    characterLimit: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, referenceImageUrl, categories, characterLimit } = body;

  if (!title || !referenceImageUrl || !categories?.length) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data: submission, error } = await supabaseAdmin
    .from("challenge_submissions")
    .insert({
      submitted_by_user_id: userId,
      title,
      reference_image_url: referenceImageUrl,
      categories,
      character_limit: characterLimit || 150,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }

  return NextResponse.json({ submission }, { status: 201 });
}
