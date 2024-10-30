"use client";
import { ChangeEventHandler, InputHTMLAttributes, useId } from "react";
import { MdErrorOutline } from "react-icons/md";
import { twMerge } from "tailwind-merge";

type TextFieldKeys =
  | "name"
  | "readOnly"
  | "required"
  | "disabled"
  | "autoComplete"
  | "maxLength"
  | "minLength"
  | "name"
  | "pattern"
  | "placeholder"
  | "value";

type TextFieldBaseProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  TextFieldKeys
>;

export interface TextFieldProps extends TextFieldBaseProps {
  type?: "password" | "text";
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  leading?: React.ReactNode;
  tailing?: React.ReactNode;
  label?: string;
  error?: string | string[] | undefined | null;
}

export function TextField({
  type = "text",
  label,
  placeholder,
  className,
  leading,
  tailing,
  error,
  ...inputProps
}: TextFieldProps) {
  const describeId = useId();

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="relative w-fit">
          {label}
          {inputProps.required && (
            <div className="-top-1 left-full absolute ml-0.5 text-lg text-sky-300">*</div>
          )}
        </span>
      )}
      <label
        className={twMerge(
          "flex items-center gap-2 border-neutral-800 focus-within:border-neutral-600 bg-neutral-900 p-2 border rounded w-full text-neutral-400 focus-within:text-neutral-300 transition-colors",
          className,
          error && "border-red-500",
        )}
      >
        {leading ? (
          <span className="flex items-center text-neutral-600">{leading}</span>
        ) : null}
        <input
          type={type}
          placeholder={placeholder}
          className="bg-transparent w-full text-inherit placeholder:text-neutral-600 outline-none"
          aria-describedby={describeId}
          {...inputProps}
        />
        {tailing ? (
          <span className="flex items-center text-neutral-600">{tailing}</span>
        ) : null}
      </label>
      {error && (
        <p
          id={describeId}
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-1 text-red-400 text-xs"
        >
          <MdErrorOutline size="1.15em" />
          {error}
        </p>
      )}
    </div>
  );
}
