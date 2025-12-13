import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";

const SUPABASE_URL = "https://takbizsveqogoxmftslm.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const BUCKET_NAME = "offers"; // Reuse existing bucket

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
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
    const type = formData.get("type") as string | null;

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

    // Generate unique file path based on type
    const fileExtension = file.name.split(".").pop() || "jpg";
    let fileName: string;

    switch (type) {
      case "restaurant-cover":
        fileName = `restaurants/covers/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        break;
      case "offer-photo":
        fileName = `offers/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        break;
      default:
        fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    }

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

    return NextResponse.json({
      url: publicUrl,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
