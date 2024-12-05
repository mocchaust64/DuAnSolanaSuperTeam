import { useLocalStorage } from "@solana/wallet-adapter-react";
import { FC, createContext, ReactNode, useContext } from "react";

// Định nghĩa kiểu cho trạng thái context
export interface AutoConnectContextState {
  autoConnect: boolean; // Trạng thái tự động kết nối
  setAutoconnect(autoConnect: boolean): void; // Hàm để cập nhật trạng thái
}

// Tạo context với giá trị mặc định
export const AutoConnectContext = createContext<AutoConnectContextState>(
  {} as AutoConnectContextState
);

// Hook để sử dụng context
export function useAutoConnect(): AutoConnectContextState {
  return useContext(AutoConnectContext); // Trả về giá trị context
}

// Cung cấp context cho các component con
export const AutoConnectProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [autoConnect, setAutoconnect] = useLocalStorage(
    "autoConnect",
    true
  ); // Sử dụng local storage để lưu trạng thái

  return (
    <AutoConnectContext.Provider value={{ autoConnect, setAutoconnect }}>
      {children} 
    </AutoConnectContext.Provider>
  );
};
