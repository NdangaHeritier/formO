import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  projectForm: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  deleteProjectForm,
  getProjectFormDetail,
  rotateProjectFormEndpoint,
  updateProjectForm,
} from "@/server/services/forms.service";

const actor = { actorUserId: "user-1", organizationId: "org-a" };

describe("form service workspace scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.projectForm.findFirst.mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));
  });

  it("getProjectFormDetail scopes by organization and 404s outside it", async () => {
    await expect(getProjectFormDetail("form-1", "org-a")).rejects.toMatchObject({ status: 404 });
    expect(prismaMock.projectForm.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "form-1", deletedAt: null, project: { organizationId: "org-a" } },
      })
    );
  });

  it("updateProjectForm rejects a form owned by another workspace", async () => {
    await expect(
      updateProjectForm({ formId: "form-1", ...actor, input: { title: "x" } as never })
    ).rejects.toMatchObject({ status: 404 });
    expect(prismaMock.projectForm.update).not.toHaveBeenCalled();
  });

  it("deleteProjectForm rejects a form owned by another workspace", async () => {
    await expect(deleteProjectForm({ formId: "form-1", ...actor })).rejects.toMatchObject({
      status: 404,
    });
    expect(prismaMock.projectForm.update).not.toHaveBeenCalled();
  });

  it("rotateProjectFormEndpoint rejects a form owned by another workspace", async () => {
    await expect(rotateProjectFormEndpoint({ formId: "form-1", ...actor })).rejects.toMatchObject({
      status: 404,
    });
    expect(prismaMock.projectForm.update).not.toHaveBeenCalled();
  });
});
