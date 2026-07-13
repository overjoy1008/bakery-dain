import type { ReactNode } from "react";

type CheckControlProps = {
  checked: boolean;
  children: ReactNode;
  onChange: (checked: boolean) => void;
};

export function CheckControl({ checked, children, onChange }: CheckControlProps) {
  return (
    <label className="check-control">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span aria-hidden="true" className="check-control-box" />
      <span className="check-control-label">{children}</span>
    </label>
  );
}
