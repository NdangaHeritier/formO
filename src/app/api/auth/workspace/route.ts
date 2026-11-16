import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { interestSchema } from "@/lib/validation/auth";
import { jsonErrorResponse, requireActiveWorkspace, requireUser } from "@/server/auth/authorization";

export async function GET() {
  try {
    const workspace = await requireActiveWorkspace("member");
    return NextResponse.json({
      user: {
        id: workspace.user.id,
        name: workspace.user.name,
        email: workspace.user.email,
        interest: workspace.user.interest,
      },
      organization: {
        id: workspace.organization.id,
        name: workspace.organization.name,
        slug: workspace.organization.slug,
      },
      role: workspace.role,
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireUser();
    const body = await request.json();
    const parsed = interestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid interest selection" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { interest: parsed.data.interest },
      select: {
        id: true,
        interest: true,
      },
    });

    const redirectTo = updated.interest === "non_developer" ? "/non-dev" : "/developer";

    return NextResponse.json({
      user: updated,
      redirectTo,
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
