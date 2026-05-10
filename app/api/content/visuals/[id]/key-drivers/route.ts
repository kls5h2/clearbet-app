import { NextRequest, NextResponse } from "next/server";
import { checkAuth, fetchVisualData, renderKeyDriversHtml } from "../../_lib";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await fetchVisualData(id);
  if (!data) {
    return NextResponse.json({ error: "Breakdown not found" }, { status: 404 });
  }

  return new NextResponse(renderKeyDriversHtml(data), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
