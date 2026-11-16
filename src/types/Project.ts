import { IconType } from "./Icon";

export type UserType ={
    name: string;
    email: string;
    id: string;
    created: string;
    updated: string;
    avatar?: string; // optional avatar URL
}

export type ProjectType = {
    id: string;
    name: string;
    slug?: string;
    description: string | null;
    created: string;
    updated: string;
    user?: UserType; // user Who created the project
    forms?: FormType[]; // Array of form IDs or titles
    formsCount?: number; // live count of active forms (from /api/projects)
    submissionsCount?: number; // live total submissions across the project's forms
    latestFormEndpoint?: string | null; // endpoint of the project's most recent form
    submissionsStats?: {
        total: number;
        sent: number;
        failed: number;
        spam: number;
        pending: number;
    };
    recentSubmissions?: {
        id: string;
        status: string;
        createdAt: string;
        formId: string;
        formTitle: string;
    }[];
    status: 'active' | 'archived'; // project status

};

export type FormType = {
    id: string;
    project?: ProjectType; // reference to the project ID
    title: string;
    description: string;
    endpoint: string;
    email_to: string;
    isActive?: boolean;
    submissionsCount?: number;
    created: string;
    updated: string;
}

export type FormSubmissionType = {
  id: string;
  form?: FormType; // if expanded
  submitted_at: string;
  data: Record<string, string | number | boolean>;
  created: string;
  updated: string;
};

export type AnalyticType= {
  title: string,
  icon: IconType,
  desc: string,
  data: {amount: number, period: "Day"|"Month"|"Year"|"All Time", rate: number | null}
}