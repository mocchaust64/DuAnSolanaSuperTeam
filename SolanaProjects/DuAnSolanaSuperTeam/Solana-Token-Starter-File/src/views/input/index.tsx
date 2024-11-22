import React, { FC } from "react";

interface InputViewProps {
  name: string;
  placeholder: string;
  clickhandle?: (e: any) => void;
}

export const InputView: React.FC<InputViewProps> = ({ name, placeholder, clickhandle }) => {
  return (
    <div className="mb-4">
      <label className="block text-white text-sm font-bold mb-2">
        {name}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        onChange={clickhandle}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        readOnly={!clickhandle}
      />
    </div>
  );
};

