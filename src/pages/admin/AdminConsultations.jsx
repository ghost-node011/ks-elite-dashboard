import { getContacts } from "../../lib/adminApi";
import LeadsTable from "./LeadsTable";

export default function AdminConsultations() {
  return <LeadsTable type="contact" title="Consultation Requests" fetcher={getContacts} />;
}
