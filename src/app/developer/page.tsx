"use client";
import { useEffect, useState } from 'react';
import DeveloperBreadcrumb from '@/components/Developer/DeveloperBreadcrumb';
import Header from '@/components/Header';
// import { IconType } from '@/types/Icon';
// import { AnalyticCard } from '@/components/Developer/AnalyticCard';
import FormButton from '@/components/Global/FormButton';
import { Icon } from '@/components/Global/Icon';
// import { getProjects } from '@/data/projects';
import ProjectCard from '@/components/Developer/ProjectCard';
import { ProjectType } from '@/types/Project';
// import { getFormsByProjectId } from '@/data/forms';
import { Squares } from '@/components/Global/Squares';
// import FeatureCard from '@/components/Global/FeatureCard';
import GuideCard from '@/components/Global/GuideCard';
import NewDeveloperForm from '@/components/Developer/Modals/Forms/NewDeveloper';
import NewForm from '@/components/Developer/Modals/Forms/NewForm';
import { FormsDisplayModel } from '@/components/Developer/Modals/Displays/DisplayProjectForms';
import LinkButton from '@/components/Global/LinkButton';
import PrivateRouter from '@/components/Global/privateRouter';
import AnalyticsGroup from '@/components/Developer/AnalyticsGroup';
  
const Developer= () => {
 
    // Fetch projects from PocketBase

    const [projects, setProjects] = useState<ProjectType[]>([]);
    useEffect(() => {
      // Demo project data
      const demoProjects: ProjectType[] = [];
      setProjects(demoProjects);
    }, []);

    // trigger to show create new project model..
    const [isCreateProjectModelOpen, setIsCreateProjectModelOpen] = useState(false);
    const [createNewForm, setCreateNewForm] = useState(false);

    // set a project id for which each form can go with..
    const [projectID, setProjectID] = useState<string| undefined>(undefined);

    // Set Project selected to view forms
    const [showFormsModal, setShowFormsModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectType>({
      id: '',
      name: '',
      description: '',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    });

  return (
    <PrivateRouter>
      <Header border='border-0' py='py-3'/>
      <DeveloperBreadcrumb
        navs={[
          { label: "Home", href: "/" },
          { label: "Developer", href: "/developer" },
        ]}
      />
      {/* display createProjectModel */}
      {isCreateProjectModelOpen && (
        <NewDeveloperForm onClick={() => setIsCreateProjectModelOpen(false)} />
      )}

      {/* Display CreateForm Model */}
      {createNewForm && (
        <NewForm onClick={() => setCreateNewForm(false)} project={projectID} />
      )}

      {/* Show Forms and Project Details Model */}
      {showFormsModal && (
        <FormsDisplayModel closeModal={() => setShowFormsModal(false)} project={selectedProject} />
      )}

      {/* Dashboard */}
      <section className="dashboard bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-5 grid grid-cols-1 gap-y-10">
        {/* Analytics section */}
        <AnalyticsGroup />

        {/* Projects Section */}
        <div className="relative rounded-lg">
          <Squares parLength={100} />
          <div className="projects relative z-10 grid grid-cols-1 gap-5 bg-gradient-to-tr from-zinc-100 to-zinc-100/50 dark:from-zinc-950 from-80% to-20% dark:to-zinc-950/50 rounded-lg p-8">
            <div className="flex items-center justify-between">
              <div className="title text-xl font-bold">Projects</div>
              <FormButton type='button' variant='primary' onClick={() => setIsCreateProjectModelOpen(true)}>
                <Icon name="Plus" size={15} className="text-zinc-200 dark:text-zinc-800" />
                  Add Project
              </FormButton>
            </div>

            {/* projects cards */}
            <div className="grid grid-cols-3 gap-5">
              {projects.length > 0 ? (
                projects.map((project, index) => (
                    <ProjectCard
                      key={index}
                      id={project.id}
                      name={project.name}
                      description={project.description}
                      user={project.user}
                      forms={project.forms}
                      created={project.created}
                      updated={project.updated}
                      status="active"
                      openForm={()=> {
                        setProjectID(project.name)
                        setCreateNewForm(true);
                      }}
                      showForms={()=> {
                        setSelectedProject(project)
                        setShowFormsModal(true);
                      }}
                    />
                  
                ))
              ) : (
                <div className="text-center text-zinc-500 p-5">
                  No projects found. Please create a new project.                
                </div>
              )}

            </div>
          </div>
        </div>

        {/* A quick start Guide */}
        <div className="quick-start rounded-lg p-5">
          <div className="icon-for-boost">
            <Icon name="Rocket" size={50} className="text-yellow-600 mb-3 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mb-3">Quick Start Guide</h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-5">
            Get started with your first project and form in just a few steps.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
              {/* Step 1: Create Project */}
              <GuideCard
              icon="FolderPlus"
              title="Create a Project"
              desc="Spin up a new project to modularize and manage your forms with ease."
              subDesc="Projects help you organize forms, submissions, and API endpoints for scalable development."
              />
              {/* Step 2: Add Forms */}
              <GuideCard
              icon="SquareCode"
              color='pink'
              title="Add Dynamic Forms"
              desc="Design and deploy robust forms inside your project."
              subDesc="Leverage our intuitive builder to create forms that capture exactly the data you need, ready for instant integration."
              />
              {/* Step 3: Integrate API */}
              <GuideCard
              icon="Code2"
              color='orange'
              title="Integrate with Auto-Generated API"
              desc="Plug your forms into any frontend using our RESTful API endpoints."
              subDesc="Copy-paste the endpoint into your codebase and start collecting submissions in real-time, with developer-friendly docs and code samples."
              />
              {/* Step 4: Real-Time Email Notifications */}
              <GuideCard
              icon="BellDot"
              color='green'
              title="Collect Beautiful Email Notifications"
              desc="Receive instant, customizable email alerts for every new submission."
              subDesc="Stay in the loop with actionable, well-designed notifications that keep your workflow efficient and responsive."
              />
            </div>
          <div className='items-start justify-start flex'>
            <LinkButton href='/login' variant='secondary'>
              <Icon name="Rocket" size={15} className="text-zinc-400 dark:text-zinc-700" />
              Quick Start
            </LinkButton>
          </div>
        </div>

      </section>
    </PrivateRouter>
  );
}

export default Developer;