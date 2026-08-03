"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BarList } from "./BarList";

export function Breakdown({
  byIndustry,
  byCompany,
}: {
  byIndustry: { label: string; count: number }[];
  byCompany: { label: string; count: number }[];
}) {
  const [dimension, setDimension] = useState<"industry" | "company">("industry");
  const data = dimension === "industry" ? byIndustry : byCompany;

  return (
    <div>
      <div className="px-4 pt-3">
        <SegmentedControl
          value={dimension}
          onChange={setDimension}
          options={[
            { value: "industry", label: "By Industry" },
            { value: "company", label: "By Company" },
          ]}
        />
      </div>
      {data.length === 0 ? (
        <p className="px-4 py-4 text-[14px] text-label-2">
          Add {dimension === "industry" ? "industries" : "companies"} to contacts to see this
          breakdown.
        </p>
      ) : (
        <BarList data={data} />
      )}
    </div>
  );
}
