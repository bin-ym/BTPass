import React from "react";
import { LucideIcon } from "lucide-react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  className = "",
}: StatsCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>

          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-700 p-4 rounded-lg">
          <Icon className="text-white" size={28} />
        </div>
      </div>
    </div>
  );
}
