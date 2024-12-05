import React, { FC, ChangeEvent } from "react";

interface InputViewProps {
  name: string;
  placeholder: string;
  className?: string; // Thêm className là optional
  clickhandle?: (e: ChangeEvent<HTMLInputElement>) => void; // Thêm kiểu cụ thể cho event
}

export const InputView: FC<InputViewProps> = ({ 
  name, 
  placeholder, 
  className = '', // Giá trị mặc định cho className
  clickhandle 
}) => {
  return (
    <div className="mb-4">
      <label className="block text-white text-sm font-bold mb-2">
        {name}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        onChange={clickhandle}
        className={`shadow appearance-none border rounded w-full py-2 px-3 
          text-gray-700 leading-tight focus:outline-none focus:shadow-outline
          ${className}`} // Kết hợp className mặc định với className được truyền vào
        readOnly={!clickhandle}
      />
    </div>
  );
};
