import React from "react";
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from "chart.js";
import { Radar } from "react-chartjs-2";
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

export default function RadarChartPage() {
  // demo data — in a real app feed from analysis features
  const data = {
    labels: ['ATS Score','Skills','Experience','Projects','Certifications','Action Verbs'],
    datasets: [
      {
        label: 'Candidate A',
        data: [70, 6, 4, 5, 2, 3],
      }
    ],
  };

  return (
    <div>
      <h2>Radar Chart (Demo)</h2>
      <div style={{width:500}}>
        <Radar data={data} />
      </div>
      <p>Use features returned by /api/analyze to populate this chart per candidate.</p>
    </div>
  );
}
