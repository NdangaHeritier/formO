"use client";
import { AnalyticType } from "@/types/Project";
import { AnalyticCard } from "./AnalyticCard";
import { fetch_projects_count_by_user_id } from "@/lib/Fetching/projects";
import { useAuth } from "@/lib/Auth_context";
import { useEffect, useState } from "react";

export default function AnalyticsGroup () {

    const { currentUser } = useAuth();
    const [projectCount, setProjectCount] = useState<number>(0);
    const [formsCount, setFormsCount] = useState<number>(0);

    useEffect(() => {
        if (currentUser?.uid) {
            fetch_projects_count_by_user_id(currentUser.uid).then(setProjectCount);
        }
    }, [currentUser]);

    const analytics: AnalyticType[] =[
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
        desc: "All projects you have created and added forms to this year.",
        data: {
          amount: projectCount,
          period: "Year",
          rate: 5
        }
      }
    ];
    return (
        <div className="analytics grid grid-cols-3 gap-5 py-3">
          {analytics.map((analytic, index)=> {
            return <AnalyticCard key={index} title={analytic.title} desc={analytic.desc} icon={analytic.icon} data={analytic.data}/>
          })}
        </div>
    );
}