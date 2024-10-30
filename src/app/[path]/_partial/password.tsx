"use client";
import { useFormState } from "react-dom";
import { visitWithPassword } from "../actions";

export function PasswordPage({ path }: { path: string }) {
  const [state, submit] = useFormState(visitWithPassword, undefined);

  return (
    <div className="rounded p-3 border border-neutral-800 bg-neutral-900">
      <h3 className="text-lg">This link is protected by password</h3>
      <form action={submit}>
        <input type="hidden" name="path" value={path} />
        <input name="password" type="password" placeholder="Password" />
        <button>Submit</button>
      </form>
      {JSON.stringify(state)}
    </div>
  );
}
