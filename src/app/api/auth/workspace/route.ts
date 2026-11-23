import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { interestSchema } from "@/lib/validation/auth";
import { jsonErrorResponse, requireActiveWorkspace, requireUser , validationErrorResponse} from "@/server/auth/authorization";

export async function GET() {
  try {
    const workspace = await requireActiveWorkspace("member");
    return NextResponse.json({
      user: {
        id: workspace.user.id,
        name: workspace.user.name,
        email: workspace.user.email,
        interest: workspace.user.interest,
        onboarding: workspace.user.onboarding ?? null,
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
      return validationErrorResponse(parsed.error, "Invalid interest selection");
    }

    // The audience choice is made once at onboarding. Once answers exist it is
    // locked, so an admin cannot use this endpoint to switch into the other view.
    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { interest: true, onboarding: true },
    });
    const onboardingCompleted =
      existing?.onboarding !== null && existing?.onboarding !== undefined;
    const interest = onboardingCompleted
      ? existing!.interest
      : parsed.data.interest;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        interest,
        onboarding: parsed.data.onboarding
          ? (parsed.data.onboarding as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      select: {
        id: true,
        interest: true,
        onboarding: true,
      },
    });

    const redirectTo = updated.interest === "non_developer" ? "/non-dev" : "/developer";

    return NextResponse.json({
      user: { id: updated.id, interest: updated.interest, onboarding: updated.onboarding ?? null },
      redirectTo,
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
