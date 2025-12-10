import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPABASE_URL = "https://takbizsveqogoxmftslm.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const BUCKET_NAME = "offers"; // Reuse existing bucket with profiles/ prefix

export async function POST(request: NextRequest) {
  try {
    // Authenticate customer
    const session = await getSession();
    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized: Customer login required" },
        { status: 401 }
      );
    }

    // Check if service key is configured
    if (!SUPABASE_SERVICE_KEY) {
      console.error("SUPABASE_SERVICE_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `profiles/${session.userId}/profile-${Date.now()}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": file.type,
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Supabase upload error:", errorText);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Construct public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;

    // Update user's photoUrl in database
    await prisma.user.update({
      where: { id: session.userId },
      data: { photoUrl: publicUrl },
    });

    return NextResponse.json({
      url: publicUrl,
      message: "Profile photo uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
