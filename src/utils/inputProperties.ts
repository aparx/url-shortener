export type InputFormFieldKeys =
  | "form"
  | "formAction"
  | "formEncType"
  | "formMethod"
  | "formNoValidate"
  | "formTarget";

export type InputBaseFieldKeys =
  | InputFormFieldKeys
  | "name"
  | "readOnly"
  | "required"
  | "disabled";

export type TextInputFieldKeys =
  | "autoComplete"
  | "capture"
  | "enterKeyHint"
  | "maxLength"
  | "minLength"
  | "name"
  | "pattern"
  | "placeholder"
  | "value";
