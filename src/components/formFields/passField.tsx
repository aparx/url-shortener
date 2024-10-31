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
    const togglePassword = () => setShowPassword((x) => !x);

    return (
      <TextField
        ref={fieldRef}
        type={showPassword ? "text" : "password"}
        tailing={
          tailing ?? (
            <button
              type="button"
              onClick={togglePassword}
              className="text-lg text-neutral-500 hover:text-neutral-300 focus-visible:text-neutral-300"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-hidden
            >
              {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
          )
        }
        {...restProps}
      />
    );
  },
);
