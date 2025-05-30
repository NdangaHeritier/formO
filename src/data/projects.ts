
import pb from "@/lib/pocketbase";
import { ProjectType } from "@/types/Project";
import { RecordModel } from "pocketbase";

export async function getProjects(): Promise<ProjectType[]> {
    try {
    // Fetch all projects with user expansion
    const records = await pb.collection('projects').getFullList<RecordModel>({
        sort: '-created',
        expand: 'user'
    });

    const projects: ProjectType[] = records.map((record) => ({
        id: record.id,
        name: record.name,
        description: record.description,
        created: record.created,
        updated: record.updated,
        user: record.expand?.user ?? undefined,
        status: 'active', // or get from record if stored
    }));

    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects");
  }
}

export async function fetchProjectById(id: string) {
  try {
    const record = await pb.collection('projects').getOne(id);
    return record; // single project object
  } catch (err) {
    console.error('Failed to fetch project:', err);
    return null;
  }
}