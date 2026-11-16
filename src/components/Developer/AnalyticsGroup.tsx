"use client";

import { useEffect, useState } from "react";
import type { AnalyticType } from "@/types/Project";
import { AnalyticCard } from "./AnalyticCard";

type AnalyticsResponse = {
  projects: { total: number; thisMonth: number; lastMonth: number; changeRate: number | null };
  forms: { total: number };
  submissions: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    changeRate: number | null;
    byStatus: { sent: number; failed: number; spam: number; pending: number };
  };
};

export default function AnalyticsGroup() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AnalyticsResponse | null) => {
        if (data) {
          setAnalytics(data);
        }
      })
      .catch(() => {});
  }, []);

  const analyticsList: AnalyticType[] = [
    {
      title: "Submissions",
      icon: "Activity",
      desc: "Submission analytics for all forms in your project currently.",
      data: {
        amount: analytics?.submissions.thisMonth ?? 0,
        period: "Month",
        rate: analytics?.submissions.changeRate ?? null,
      },
    },
    {
      title: "Forms",
      icon: "SquareCode",
      desc: "Forms you have created in every project currently",
      data: {
        amount: analytics?.forms.total ?? 0,
        period: "All Time",
        rate: null,
      },
    },
    {
      title: "Projects",
      icon: "Folder",
      desc: "All projects you have created and added forms to this year.",
      data: {
        amount: analytics?.projects.total ?? 0,
        period: "Month",
        rate: analytics?.projects.changeRate ?? null,
      },
    },
  ];

  return (
    <div className="analytics grid grid-cols-3 gap-5 py-3 space-x-4">
      {analyticsList.map((analytic, index) => (
        <AnalyticCard
          key={index}
          title={analytic.title}
          desc={analytic.desc}
          icon={analytic.icon}
          data={analytic.data}
        />
      ))}
    </div>
  );
}
