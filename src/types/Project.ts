
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
    description: string;
    created: string;
    updated: string;
    user?: UserType; // user Who created the project
    forms?: FormType[]; // Array of form IDs or titles
    status: 'active' | 'archived'; // project status

};

export type FormType = {
    id: string;
    project?: ProjectType; // reference to the project ID
    title: string;
    description: string;
    endpoint: string;
    email_to: string;
    created: string;
    updated: string;
}

export type FormSubmissionType = {
  id: string;
  form?: FormType; // if expanded
  submitted_at: string;
  data: Record<string, any>;
  created: string;
  updated: string;
};