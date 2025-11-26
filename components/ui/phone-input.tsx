"use client";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useId } from "react";

export default function UiPhoneInput({ value, onChange, error }: Readonly<{ value: string | undefined; onChange: (val?: string) => void; error?: string }>) {
  const id = useId();
  return (
    <div className="w-full">
      <PhoneInput
        id={id}
        defaultCountry="CH"
        international={true}
        value={value}
        onChange={onChange}
        className="PhoneInput w-full"
      />
      {error && <div className="mt-1 text-sm text-red-500">{error}</div>}
    </div>
  );
}

export { isValidPhoneNumber } from "react-phone-number-input";
