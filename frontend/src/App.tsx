import { Navigate, Route, Routes } from "react-router-dom";
import { FormsList } from "./form-builder/components/forms-list.component";
import { FormBuilderEditor } from "./form-builder/components/form-builder.component";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FormsList />} />
      <Route path="/forms" element={<FormsList />} />
      <Route path="/forms/new" element={<FormBuilderEditor />} />
      <Route path="/forms/:formId" element={<FormBuilderEditor />} />
      <Route path="*" element={<Navigate to="/forms" replace />} />
    </Routes>
  );
}
