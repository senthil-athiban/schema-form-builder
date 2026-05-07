export interface FormSchema {
    id: string;
    version: string;
    metadata: {
        title: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
        author?: string;
    };
    settings: {
        theme?: string;
        submitButton?: {
            label: string;
            position: 'left' | 'center' | 'right';
        };
        notifications?: {
            success?: string;
            error?: string;
        };
    };
    pages: FormPage[];
    validation: ValidationRule[];
    conditionalLogic?: ConditionalRule[];
}

export interface FormPage {
    id: string;
    label: string;
    sections: FormSection[];
    order: number;

    hidden?: boolean;
}

export interface FormSection {
    id: string;
    label: string;
    order: number;
    questions: FormQuestion[];

    hidden?: boolean;
}

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'number' 
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'file'
  | 'rating'
  | 'slider'
  | 'phone'
  | 'url'
  | 'section' // for grouping
  | 'html'; // for rich content

export type WidthType = '25%' | '50%' | '75%' | '100%';
export interface FormQuestion {
    id: string;
    type: FieldType;
    label: string;
    name: string;
    placeholder?: string;
    defaultValue?: unknown;
    required: boolean;
    disabled?: boolean;
    hidden?: boolean;

    // Layout & positioning
    order: number;
    width?: WidthType;

    // field-specific configurations
    config?: FieldConfig;

    // Validation rules specific to this field
    validation?: FieldValidation;

    styles?: {
        className?: string;
        customCSS?: Record<string, string>;
    };
}

export type FormField = FormQuestion;
export interface FieldConfig {
    options?: Array<{
        label: string;
        value: string | number;
        disabled?: boolean;
    }>

    // For number, slider
    min?: number;
    max?: number;
    step?: number;

    // For text, textarea
    minLength?: number;
    maxLength?: number;
    pattern?: string;

    // For file upload
    accept?: string[];
    maxSize?: number; // in bytes
    multiple?: boolean;

    // For rich text/html
    content?: string;
}

export interface FieldValidation {
    rules: Array<{
        type: 'required' | 'email' | 'url' | 'pattern' | 'min' | 'max' | 'custom';
        value?: unknown;
        message: string;
    }>
}

type Logic = 'AND' | 'OR'; // for multiple conditions
type Operator = 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
type ActionType = 'show' | 'hide' | 'enable' | 'disable' | 'setValue';

export interface ConditionalRule {
    id: string;
    conditions: Array<{
        fieldId: string;
        operator: Operator;
        value: unknown;
        logic?: Logic; // for multiple conditions
    }>;
    actions: Array<{
        type: ActionType;
        targetFieldId: string;
        value?: unknown;
    }>;
}