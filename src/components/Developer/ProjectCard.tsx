import { FormType, ProjectType } from "@/types/Project";
import FormButton from "../Global/FormButton";
import { Icon } from "../Global/Icon";

type cardProps = {
    id: ProjectType['id'];
    name:  ProjectType['name'];
    description:  ProjectType['description'];
    created?: ProjectType['created'];
    updated?: ProjectType['updated'];
    user?: ProjectType['user'];
    forms?: FormType[]; // Array of form IDs or titles
    status: 'active' | 'archived';
    openForm: () => void;
    showForms: () => void
}
export default function ProjectCard ({name, description, user, forms, status, id, openForm, showForms}:cardProps) {
    return (
        <div className="project-card p-5 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-lg grid grid-cols-1 gap-3">
            <div className="flex items-start justify-between">
                <div className="details grid grid-cols-1 gap-2">
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{name}</h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-400">{description}</p>                   
                </div>
                <div className="flex items-center h-10 w-10 justify-center rounded-full hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50">
                    <Icon name='MoreHorizontal' size={16} className="" />
                </div>
            </div>
             {/* <div className="text-sm text-zinc-600 dark:text-zinc-500 flex items-center justify-between gap-1 py-2">
                <div className="">
                    <span className="flex items-center gap-1">
                    <Icon name="UserCircle" size={18} strokeWidth={2} className="text-yellow-600" />
                    {user?.name || 'Unknown'}
                </span>
                </div>
                <div className="text-end">{user?.email}</div>
            </div> */}
            <div className="active-and-created-at flex items-center justify-between py-5">
                <span className="bg-zinc-950 text-zinc-100 px-3 py-1 rounded-full text-xs font-medium dark:bg-zinc-50 dark:text-zinc-950">
                    {status}
                </span>
                <p className="text-xs text-zinc-700 dark:text-zinc-500">
                    Created <span className="text-zinc-200">{new Date().toLocaleDateString()}</span> {/* Replace with actual date */}
                </p>
            </div>
            <div className="form-details grid grid-cols-2 gap-">
                <p className="text-sm text-zinc-700 dark:text-zinc-400">
                    Forms: {forms?.length}
                </p>
                <p className="text-sm text-end text-zinc-700 dark:text-zinc-400">
                    Total Submissions: 200
                </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
                <FormButton type='button' variant='secondary' onClick={showForms}>
                    <Icon name="SquareArrowUpRight" size={15} className="text-zinc-700 dark:text-zinc-400" />
                    View Forms
                </FormButton>
                <FormButton type='button' variant='secondary' onClick={openForm}>
                    <Icon name="Plus" size={15} className="text-zinc-700 dark:text-zinc-400" />
                    Add Form
                </FormButton>
            </div>

            <div className="latest-endpoint border-t border-zinc-300 dark:border-zinc-800 py-3">
                <div className="title-and-copy-endpoint-icon flex items-center justify-between py-3">
                    <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Latest Endpoint</h4>
                    <button className="flex items-center justify-center h-10 w-10 cursor-pointer rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition">
                        <Icon name="Copy" size={16} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300 transition" onClick={() => {
                            navigator.clipboard.writeText(`https://api.formo.com/project/${id}/endpoint`);
                            alert('Endpoint copied to clipboard!');
                        }} />
                    </button>
                </div>
                <div className="flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-900/70 p-3 rounded-lg">
                    {/* <Icon name="Terminal" size={16} className="text-zinc-500" strokeWidth={2} /> */}
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">https://api.formo.com/project/{id}/endpoint</span>
                </div>
            </div>
        </div>
    )
}