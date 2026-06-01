import React from "react";
import type { FormField } from "../../shared/types";
import { TextField, EmailField, NumberField, TextareaField, SelectField, MultiSelectField, RadioField, CheckboxField, DateField, TimeField } from "./fields";
import { FieldWrapper } from "./fields/field-wrapper.component";

export default function FormFieldsDemo() {
    const [formData, setFormData] = React.useState<Record<string, any>>({});
    
    // Mock register function for demo
    const mockRegister = (name: string) => ({
      name,
      onChange: (e: any) => {
        const value = e.target.type === 'checkbox' 
          ? (e.target.checked ? e.target.value : '')
          : e.target.value;
        setFormData(prev => ({ ...prev, [name]: value }));
      },
      onBlur: () => {},
      ref: () => {},
    });
  
    const sampleFields: FormField[] = [
      {
        id: 'field_1',
        type: 'text',
        label: 'Full Name',
        name: 'fullName',
        placeholder: 'Enter your full name',
        required: true,
        disabled: false,
        hidden: false,
        order: 1,
        width: '50%',
      },
      {
        id: 'field_2',
        type: 'email',
        label: 'Email Address',
        name: 'email',
        placeholder: 'you@example.com',
        required: true,
        disabled: false,
        hidden: false,
        order: 2,
        width: '50%',
      },
      {
        id: 'field_3',
        type: 'number',
        label: 'Age',
        name: 'age',
        placeholder: 'Enter your age',
        required: true,
        disabled: false,
        hidden: false,
        order: 3,
        width: '25%',
        config: { min: 18, max: 120, step: 1 },
      },
      {
        id: 'field_4',
        type: 'date',
        label: 'Birth Date',
        name: 'birthDate',
        required: true,
        disabled: false,
        hidden: false,
        order: 4,
        width: '25%',
      },
      {
        id: 'field_5',
        type: 'time',
        label: 'Preferred Time',
        name: 'time',
        required: false,
        disabled: false,
        hidden: false,
        order: 5,
        width: '25%',
      },
      {
        id: 'field_6',
        type: 'select',
        label: 'Country',
        name: 'country',
        placeholder: 'Select your country',
        required: true,
        disabled: false,
        hidden: false,
        order: 6,
        width: '50%',
        config: {
          options: [
            { label: 'United States', value: 'US' },
            { label: 'United Kingdom', value: 'UK' },
            { label: 'Canada', value: 'CA' },
            { label: 'India', value: 'IN' },
          ],
        },
      },
      {
        id: 'field_7',
        type: 'multiselect',
        label: 'Interests (Multi-select)',
        name: 'interests',
        required: false,
        disabled: false,
        hidden: false,
        order: 7,
        width: '50%',
        config: {
          options: [
            { label: 'Programming', value: 'programming' },
            { label: 'Design', value: 'design' },
            { label: 'Marketing', value: 'marketing' },
            { label: 'Data Science', value: 'data_science' },
          ],
        },
      },
      {
        id: 'field_8',
        type: 'radio',
        label: 'Gender',
        name: 'gender',
        required: true,
        disabled: false,
        hidden: false,
        order: 8,
        width: '50%',
        config: {
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Non-binary', value: 'non_binary' },
            { label: 'Prefer not to say', value: 'prefer_not_to_say' },
          ],
        },
      },
      {
        id: 'field_9',
        type: 'checkbox',
        label: 'Skills',
        name: 'skills',
        required: false,
        disabled: false,
        hidden: false,
        order: 9,
        width: '50%',
        config: {
          options: [
            { label: 'JavaScript', value: 'javascript' },
            { label: 'Python', value: 'python' },
            { label: 'Java', value: 'java' },
            { label: 'C++', value: 'cpp' },
          ],
        },
      },
      {
        id: 'field_10',
        type: 'textarea',
        label: 'About You',
        name: 'bio',
        placeholder: 'Tell us about yourself...',
        required: false,
        disabled: false,
        hidden: false,
        order: 10,
        width: '100%',
        config: { minLength: 10, maxLength: 500 },
      },
      {
        id: 'field_11',
        type: 'checkbox',
        label: 'Terms and Conditions',
        name: 'terms',
        placeholder: 'I agree to the terms and conditions',
        required: true,
        disabled: false,
        hidden: false,
        order: 11,
        width: '100%',
      },
    ];
  
    const fieldComponents: Record<string, React.ComponentType<any>> = {
      text: TextField,
      email: EmailField,
      number: NumberField,
      textarea: TextareaField,
      select: SelectField,
      multiselect: MultiSelectField,
      radio: RadioField,
      checkbox: CheckboxField,
      date: DateField,
      time: TimeField,
    };
  
    return (
      <div style={{ 
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#F9FAFB',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}>
          <h1 style={{ 
            fontSize: '1.875rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: '#111827'
          }}>
            Form Field Components Demo
          </h1>
          <p style={{ 
            color: '#6B7280',
            marginBottom: '2rem'
          }}>
            All field types with React Hook Form integration
          </p>
  
          <form style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {sampleFields.map((field) => {
              const FieldComponent = fieldComponents[field.type];
              if (!FieldComponent) return null;
  
              return (
                <div key={field.id} style={{ width: field.width === '100%' ? '100%' : `calc(${field.width} - 0.5rem)` }}>
                  <FieldWrapper
                    label={field.label}
                    required={field.required}
                    width="100%"
                  >
                    <FieldComponent
                      field={field}
                      register={mockRegister}
                      disabled={field.disabled}
                      error={false}
                    />
                  </FieldWrapper>
                </div>
              );
            })}
  
            <div style={{ width: '100%', marginTop: '1rem' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
              >
                Submit Form
              </button>
            </div>
          </form>
  
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#F3F4F6',
            borderRadius: '0.375rem',
            borderLeft: '4px solid #3B82F6',
          }}>
            <h3 style={{ 
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Form Data (Live Preview)
            </h3>
            <pre style={{ 
              fontSize: '0.75rem',
              color: '#6B7280',
              overflow: 'auto',
              margin: 0,
            }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }