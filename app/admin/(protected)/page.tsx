import { AdminPlaceholder } from '../_components/admin-placeholder';

export default function AdminHomePage() {
  return (
    <AdminPlaceholder
      eyebrow="Prehľad"
      title="Admin dashboard je pripravený."
      description="Sekcia je chránená Supabase Auth a zatiaľ obsahuje iba kostru. V ďalšej fáze sem pridáme kalendár, rezervácie a zákazníkov."
      note="V tejto fáze sa nič neupravuje, iba sa overuje prístup a layout."
    />
  );
}
