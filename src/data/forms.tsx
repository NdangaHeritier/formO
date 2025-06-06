// /data/forms.ts
import pb from "@/lib/pocketbase";
import { FormType } from "@/types/Project";

export async function getFormsByProjectId(projectId: string): Promise<FormType[]> {
  try {
    const forms = await pb.collection('project_forms').getFullList({
      filter: `project = "${projectId}"`,
      sort: '-created',
      expand: 'project',
    });
    // Map the records to FormType
    const mappedForms: FormType[] = forms.map((form) => ({
        id: form.id,
        project: form.expand?.project ?? undefined,
        title: form.title,
        description: form.description,
        endpoint: form.endpoint,
        email_to: form.email_to,
        created: form.created,
        updated: form.updated,
        }));
    return mappedForms;
  } catch (error) {
    console.error("Error fetching forms:", error);
    return [];
  }
}