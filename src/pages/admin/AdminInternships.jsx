import { getInternships } from "../../lib/adminApi";
import LeadsTable from "./LeadsTable";

export default function AdminInternships() {
  return <LeadsTable type="internship" title="Internship Applications" fetcher={getInternships} />;
}
