import { Navigate, Route, Routes } from "react-router-dom";
import { FormsList } from "./form-builder/components/forms-list.component";
import { FormBuilderEditor } from "./form-builder/components/form-builder.component";
import { FormSubmissionsPage } from "./form-builder/components/form-submissions-page.component";
import { PublicFormPage } from "./form-engine/components/public-form-page.component";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FormsList />} />
      <Route path="/forms" element={<FormsList />} />
      <Route path="/forms/new" element={<FormBuilderEditor />} />
      <Route path="/forms/:formId/submissions" element={<FormSubmissionsPage />} />
      <Route path="/forms/:formId" element={<FormBuilderEditor />} />
      <Route path="/f/:token" element={<PublicFormPage />} />
      <Route path="*" element={<Navigate to="/forms" replace />} />
    </Routes>
  );
}
