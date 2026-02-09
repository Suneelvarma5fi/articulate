import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: challenges, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .order("active_date", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }

  return NextResponse.json({ challenges: challenges || [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const title = formData.get("title") as string | null;
  const categoriesRaw = formData.get("categories") as string | null;
  const characterLimit = Number(formData.get("characterLimit")) || 150;
  const activeDate = formData.get("activeDate") as string | null;
  const file = formData.get("image") as File | null;

  const categories = categoriesRaw ? JSON.parse(categoriesRaw) : [];

  if (!title || !categories.length || !activeDate || !file) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "File must be an image" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${activeDate}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("reference-images")
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json(
      { error: `Failed to upload image: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("reference-images")
    .getPublicUrl(filename);

  const referenceImageUrl = urlData.publicUrl;

  const { data: challenge, error } = await supabaseAdmin
    .from("challenges")
    .insert({
      title,
      reference_image_url: referenceImageUrl,
      categories,
      character_limit: characterLimit,
      active_date: activeDate,
      status: "active",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("unique")) {
      return NextResponse.json(
        { error: "A challenge already exists for that date" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }

  return NextResponse.json({ challenge }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing challenge ID" }, { status: 400 });
  }

  // Get the challenge to find the image filename
  const { data: challenge } = await supabaseAdmin
    .from("challenges")
    .select("reference_image_url")
    .eq("id", id)
    .single();

  // Delete from database
  const { error } = await supabaseAdmin
    .from("challenges")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete challenge" },
      { status: 500 }
    );
  }

  // Clean up storage image
  if (challenge?.reference_image_url) {
    const filename = challenge.reference_image_url.split("/").pop();
    if (filename) {
      await supabaseAdmin.storage
        .from("reference-images")
        .remove([filename]);
    }
  }

  return NextResponse.json({ deleted: true });
}
