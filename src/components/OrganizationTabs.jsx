import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";

const tabs = [
  { label: "Organization", path: "/my-organization" },
  { label: "Business unit", path: "/onboard-bu" },
  { label: "Project", path: "/onboard-project" },
];

export default function OrganizationTabs() {
  return (
    <div className="flex gap-6 border-b text-sm font-medium text-muted-foreground">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            cn(
              "pb-3 transition-colors hover:text-primary",
              isActive && "border-b-2 border-primary text-primary"
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
