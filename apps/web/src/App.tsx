import { Navigate, Route, Routes } from "react-router-dom";
import { FormsList } from "./form-builder/components/forms-list.component";
import { FormBuilderEditor } from "./form-builder/components/form-builder.component";
import { FormSubmissionsPage } from "./form-builder/components/form-submissions-page.component";
import { PublicFormPage } from "./form-engine/components/public-form-page.component";
import { WorkflowsList } from "./workflow-builder/components/workflows-list.component";
import { WorkflowEditor } from "./workflow-builder/components/workflow-editor.component";
import { RequireAuth } from "./auth/require-auth";
import { LoginPage } from "./auth/login-page";
import { SignupPage } from "./auth/signup-page";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/f/:token" element={<PublicFormPage />} />

      {/* Protected */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Navigate to="/forms" replace />} />
        <Route path="/forms" element={<FormsList />} />
        <Route path="/forms/new" element={<FormBuilderEditor />} />
        <Route path="/forms/:formId" element={<FormBuilderEditor />} />
        <Route path="/forms/:formId/submissions" element={<FormSubmissionsPage />} />
        <Route path="/forms/:formId/workflows" element={<WorkflowsList />} />
        <Route path="/forms/:formId/workflows/:workflowId" element={<WorkflowEditor />} />
        <Route path="*" element={<Navigate to="/forms" replace />} />
      </Route>
    </Routes>
  );
}
