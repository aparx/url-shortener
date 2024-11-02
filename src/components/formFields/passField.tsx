"use client";
import { forwardRef, useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { TextField, TextFieldProps, TextFieldRef } from "./textField";

export type PassFieldProps = Omit<TextFieldProps, "type">;

export type PassFieldRef = TextFieldRef;

export const PassField = forwardRef<PassFieldRef, PassFieldProps>(
  function PassField(props, fieldRef) {
    const { tailing, ...restProps } = props;
    const [showPassword, setShowPassword] = useState(false);
    return (
      <TextField
        ref={fieldRef}
        type={showPassword ? "text" : "password"}
        tailing={
          tailing ?? (
            <PasswordToggleButton
              onToggle={() => setShowPassword((x) => !x)}
              shown={showPassword}
            />
          )
        }
        {...restProps}
      />
    );
  },
);

function PasswordToggleButton({
  shown,
  onToggle,
}: {
  shown?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-lg text-neutral-500 hover:text-neutral-300 focus-visible:text-neutral-300"
      aria-label={shown ? "Hide password" : "Show password"}
      aria-hidden
    >
      {shown ? <IoMdEyeOff /> : <IoMdEye />}
    </button>
  );
}
