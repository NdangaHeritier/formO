import { ProjectType } from "@/types/Project";
import Layout from "../Layout"
import { Icon } from "@/components/Global/Icon";

type DisplayType = {
    project: ProjectType;
    closeModal: () => void;
}
export const FormsDisplayModel = ({project, closeModal}:DisplayType) => {
    const {name, description, forms, status}: ProjectType = project;
    return(
        <Layout onClick={closeModal}>
            <div className="bg-white dark:bg-zinc-950 border sm:min-w-4xl border-zinc-300 dark:border-zinc-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex items-start justify-between">
                    <div className="details grid grid-cols-1 gap-2">
                        <h3 className="text-lg font-semibold text-zinc-200">{name}</h3>
                        <p className="text-sm text-zinc-400">{description}</p>                   
                    </div>
                    <div className="flex items-center h-10 w-10 justify-center rounded-full hover:bg-zinc-900/50">
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
                    <p className="text-xs text-zinc-500">
                        Created <span className="text-zinc-200">{new Date().toLocaleDateString()}</span> {/* Replace with actual date */}
                    </p>
                </div>
                <div className="form-details grid grid-cols-2 gap-">
                    <p className="text-sm text-zinc-400">
                        Forms: {forms?.length}
                    </p>
                    <p className="text-sm text-end text-zinc-400">
                        Total Submissions: 200
                    </p>
                </div>

                {/* list ALL FORMS INSIDE PROJECT */}

                <div className="grid grid-cols-3 max-sm:grid-cols-1 w-full py-5 gap-5">
                    {forms == null ? (
                        <div className="text-zinc-500">No Forms found in project!</div>
                    ):
                    (
                        forms.map((form, index) => (
                            <div key={index} className="formCard p-5 border-zinc-800 bg-zinc-900/40 rounded-lg">
                                <h2 className="fomTitle text-zinc-200 text-base font-bold">{form.title}</h2>
                            </div>
                        )))}
                </div>
            </div>
        </Layout>
    )
}