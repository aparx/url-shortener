"use client";
import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { TextField, TextFieldProps } from "./textField";

export type PassFieldProps = Omit<TextFieldProps, "type" | "tailing">;

export function PassField(props: PassFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword((x) => !x);

  return (
    <TextField
      type={showPassword ? "text" : "password"}
      tailing={
        <button
          type="button"
          onClick={togglePassword}
          className="text-lg text-neutral-500 hover:text-neutral-300 focus-visible:text-neutral-300"
          aria-hidden
        >
          {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
        </button>
      }
      {...props}
    />
  );
}
