"use client";
import { useEffect, useState } from 'react';
import DeveloperBreadcrumb from '@/components/Developer/DeveloperBreadcrumb';
import Header from '@/components/Header';
import { IconType } from '@/types/Icon';
import { AnalyticCard } from '@/components/Developer/AnalyticCard';
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

type AnalyticType= {
  title: string,
  icon: IconType,
  desc: string,
  data: {amount: number, period: "Month"|"Day"|"Year", rate: number}
}
  
const Developer= () => {
    // const [isLoading, setIsLoading] = useState(true);

    // useEffect(() => {
    //     // Simulate a loading delay
    //     const timer = setTimeout(() => {
    //         setIsLoading(false);
    //     }, 1000); // 1 second delay

    //     return () => clearTimeout(timer);
    // }, []);
  
    const Analytics : AnalyticType[] =[
      {
        title: "Submissions",
        icon: "Activity",
        desc: "Submission analytics for all forms in your project currently.",
        data: {
          amount: 200,
          period: "Month",
          rate: 1000
        }
      },
      {
        title: "Forms",
        icon: "SquareCode",
        desc: "Forms you have created in every project currently",
        data: {
          amount: 10,
          period: "Month",
          rate: 20
        }
      },
      {
        title: "Projects",
        icon: "Folder",
        desc: "All projects you have created and added forms to this month.",
        data: {
          amount: 4,
          period: "Year",
          rate: 5
        }
      }
    ];

    // Fetch projects from PocketBase

    const [projects, setProjects] = useState<ProjectType[]>([]);
    // useEffect(() => {
    //    getProjects().then(async (projectList) => {
    //     const fullProjects = await Promise.all(projectList.map(async (project) => {
    //       const forms = await getFormsByProjectId(project.id);
    //       return { ...project, forms };
    //     }));
    //     setProjects(fullProjects);
    //   });
    // }, []);
    useEffect(() => {
      // Demo project data
      const demoProjects: ProjectType[] = [
        {
          id: "1",
          name: "Demo Project",
          description: "This is a demo project for display purposes.",
          user: {
            id: "u1",
            name: "Demo User",
            email: "demo@example.com",
            avatar: "https://i.pravatar.cc/150?img=1",
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          },
          forms: [
            {
              id: "form1",
              title: "Demo Form",
              description: "A sample form in the demo project.",
              created: new Date().toISOString(),
              endpoint: "https://example.com/submit",
              email_to: "ndanga@hn.b",
              updated: new Date().toISOString(),
            }
          ],
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          status: "active"
        },
        {
          id: "2",
          name: "Sample Project",
          description: "Another example project for demonstration.",
          user: {
            id: "u2",
            name: "Sample User",
            email: "sample@example.com",
            avatar: "https://i.pravatar.cc/150?img=2",
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          },
          forms: [
            {
              id: "form2",
              title: "Sample Form",
              description: "A sample form in the sample project.",
              created: new Date().toISOString(),
              endpoint: "https://example.com/sample-submit",
              email_to: "sample@hn.b",
              updated: new Date().toISOString(),
            }
          ],
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          status: "active"
        }
      ];
      setProjects(demoProjects);
    }, []);

    // trigger to show create new project model..
    const [isCreateProjectModelOpen, setIsCreateProjectModelOpen] = useState(false);

  return (
    <>
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
      <section className="dashboard bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 p-5 grid grid-cols-1 gap-y-10">
        {/* Analytics section */}
        <div className="analytics grid grid-cols-3 gap-5 p-3">
          {Analytics.map((analytic, index)=> {
            return <AnalyticCard key={index} title={analytic.title} desc={analytic.desc} icon={analytic.icon} data={analytic.data}/>
          })}
        </div>

        {/* Projects Section */}
        <div className="relative rounded-lg">
          <Squares parLength={100} />
          <div className="projects relative z-10 grid grid-cols-1 gap-5 bg-gradient-to-tr from-zinc-950 from-80% to-20% to-zinc-950/50 rounded-lg p-8">
            <div className="flex items-center justify-between">
              <div className="title text-xl font-bold">Projects</div>
              <FormButton type='button' variant='primary' onClick={() => setIsCreateProjectModelOpen(true)}>
                <Icon name="Plus" size={15} className="text-zinc-200 dark:text-zinc-800" />
                  Create Project
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
              color='yellow-500'
              title="Add Dynamic Forms"
              desc="Design and deploy robust forms inside your project."
              subDesc="Leverage our intuitive builder to create forms that capture exactly the data you need, ready for instant integration."
              />
              {/* Step 3: Integrate API */}
              <GuideCard
              icon="Code2"
              color='green-600'
              title="Integrate with Auto-Generated API"
              desc="Plug your forms into any frontend using our RESTful API endpoints."
              subDesc="Copy-paste the endpoint into your codebase and start collecting submissions in real-time, with developer-friendly docs and code samples."
              />
              {/* Step 4: Real-Time Email Notifications */}
              <GuideCard
              icon="Mail"
              color='green-500'
              title="Collect Beautiful Email Notifications"
              desc="Receive instant, customizable email alerts for every new submission."
              subDesc="Stay in the loop with actionable, well-designed notifications that keep your workflow efficient and responsive."
              />
            </div>
          <FormButton type='button' variant='secondary' onClick={() => {
            // Handle quick start logic here
            console.log("Quick Start button clicked");
          }}>
            <Icon name="Rocket" size={15} className="text-zinc-500" />
            Quick Start
          </FormButton>
        </div>

      </section>
    </>
  );
}

export default Developer;