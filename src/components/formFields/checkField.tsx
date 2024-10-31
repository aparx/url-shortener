import { ChangeEventHandler, InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type CheckFieldKeys =
  | "name"
  | "readOnly"
  | "required"
  | "disabled"
  | "placeholder"
  | "checked"
  | "defaultChecked";

type CheckFieldBaseProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  CheckFieldKeys
>;

export interface CheckFieldProps extends CheckFieldBaseProps {
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  label: string;
}

export function CheckField({
  className,
  label,
  ...inputProps
}: CheckFieldProps) {
  return (
    <label
      className={twMerge(
        "flex items-center gap-2 border-neutral-800 focus-within:border-neutral-700 bg-neutral-950 p-2 border rounded cursor-pointer group",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...inputProps} />
      <span className="relative after:absolute after:inset-0.5 border-neutral-800 peer-checked:border-sky-400 peer-checked:after:bg-sky-400 peer-checked:bg-sky-950 border rounded after:rounded-sm w-[1.25em] h-[1.25em] transition-colors after:transition-colors" />
      <span className="group-hover:text-neutral-300 group-focus-within:text-neutral-300 text-neutral-400 peer-checked:text-neutral-300 transition-colors">
        {label}
      </span>
    </label>
  );
}
