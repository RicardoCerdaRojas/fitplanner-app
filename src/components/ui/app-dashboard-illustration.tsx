
'use client';
import type { SVGProps } from 'react';

export function AppDashboardIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 380"
      className="rounded-lg shadow-2xl"
      {...props}
    >
      {/* Main Background */}
      <rect width="500" height="380" rx="10" fill="#1f2937" />

      {/* Sidebar */}
      <rect x="10" y="10" width="100" height="360" rx="5" fill="#374151" />
      <rect x="25" y="30" width="70" height="10" rx="3" fill="#4b5563" />
      <rect x="25" y="55" width="50" height="8" rx="3" fill="#4b5563" />
      <rect x="25" y="75" width="50" height="8" rx="3" fill="#4b5563" />
      <rect x="25" y="95" width="50" height="8" rx="3" fill="#4b5563" />
      <rect x="25" y="115" width="50" height="8" rx="3" fill="#4b5563" />
      
      {/* Main Content Area */}
      <g>
        {/* Header */}
        <rect x="125" y="30" width="200" height="15" rx="4" fill="#4b5563" />
        <rect x="125" y="55" width="120" height="10" rx="3" fill="#4b5563" />

        {/* Chart Card */}
        <rect x="125" y="85" width="360" height="150" rx="5" fill="#374151" />
        <path d="M 140 215 C 190 160, 240 190, 290 150 S 390 120, 440 160" stroke="#34d399" strokeWidth="3" fill="none" />
        <circle cx="140" cy="215" r="3" fill="#34d399" />
        <circle cx="215" cy="175" r="3" fill="#34d399" />
        <circle cx="290" cy="150" r="3" fill="#34d399" />
        <circle cx="365" cy="130" r="3" fill="#34d399" />
        <circle cx="440" cy="160" r="3" fill="#34d399" />
        <path d="M 140 220 L 460 220" stroke="#4b5563" strokeWidth="1" strokeDasharray="2" />
        <path d="M 140 180 L 460 180" stroke="#4b5563" strokeWidth="1" strokeDasharray="2" />
        <path d="M 140 140 L 460 140" stroke="#4b5563" strokeWidth="1" strokeDasharray="2" />


        {/* Lower Cards */}
        <rect x="125" y="250" width="170" height="120" rx="5" fill="#374151" />
        <rect x="315" y="250" width="170" height="120" rx="5" fill="#374151" />

        {/* Left Card Content */}
        <rect x="140" y="265" width="80" height="10" rx="3" fill="#4b5563" />
        <rect x="140" y="285" width="140" height="7" rx="3" fill="#10b981" />
        <rect x="140" y="300" width="120" height="7" rx="3" fill="#10b981" />
        <rect x="140" y="315" width="140" height="7" rx="3" fill="#4b5563" />
        <rect x="140" y="330" width="100" height="7" rx="3" fill="#4b5563" />

        {/* Right Card Content (Progress Circle) */}
        <circle cx="400" cy="310" r="40" stroke="#4b5563" strokeWidth="8" fill="none" />
        <path d="M 400 270 A 40 40 0 1 1 365 345" stroke="#10b981" strokeWidth="8" fill="none" />
        <path d="M 390 305 L 400 315 L 415 300" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}
