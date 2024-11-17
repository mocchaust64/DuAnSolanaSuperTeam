import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base"; // Nhập các thành phần cần thiết từ Solana
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"; // Nhập các provider cho ví
import { WalletModalProvider as ReactUIWalletModalProvider } from "@solana/wallet-adapter-react-ui"; // Nhập modal provider cho ví
import { PhantomWalletAdapter, SolflareWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, TorusWalletAdapter } from "@solana/wallet-adapter-wallets"; // Nhập các adapter ví
import { Cluster, clusterApiUrl } from "@solana/web3.js"; // Nhập các thành phần cần thiết từ Solana Web3
import { FC, ReactNode, useCallback, useMemo } from "react"; // Nhập các hook từ React
import { AutoConnectProvider, useAutoConnect } from "./AutoConnectProvider"; // Nhập provider và hook từ AutoConnectProvider
import { notify } from "../utils/notifications"; // Nhập hàm thông báo
import { NetworkConfigurationProvider, useNetworkConfiguration } from "./NetworkConfigurationProvider"; // Nhập provider và hook từ NetworkConfigurationProvider

// Cung cấp context cho ví
const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { autoConnect } = useAutoConnect(); // Lấy trạng thái tự động kết nối
  const { networkConfiguration } = useNetworkConfiguration(); // Lấy cấu hình mạng
  const network = networkConfiguration as WalletAdapterNetwork; // Chuyển đổi kiểu

  // Tạo endpoint cho mạng
  const originaEndPoint = useMemo(() => clusterApiUrl(network), [network]);

  let endPoint;

  // Xác định endpoint dựa trên mạng
  if (network == "mainnet-beta") {
    endPoint = "https://solana-mainnet.g.alchemy.com/v2/7q2lqmSCg6b7xhMUAI61YcSE5IlEMJkE"; // Thay thế bằng URL thực tế
  } else if (network == "devnet") {
    endPoint = originaEndPoint;
  } else {
    endPoint = originaEndPoint;
  }

  // Tạo danh sách ví
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletWalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  // Xử lý lỗi
  const onError = useCallback((error: WalletError) => {
    notify({
      type: "error",
      message: error.message ? `${error.name}: ${error.message}` : error.name,
    });

    console.error(error);
  }, []);

  return (
    <ConnectionProvider endpoint={endPoint}>
    <WalletProvider wallets={wallets} onError={onError} autoConnect={autoConnect}>
      <div suppressHydrationWarning>
        <ReactUIWalletModalProvider>
          <div suppressHydrationWarning>
            {children}
          </div>
        </ReactUIWalletModalProvider>
      </div>
    </WalletProvider>
  </ConnectionProvider>
  );
};

// Sửa đổi khai báo ConnectionProvider
export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      <NetworkConfigurationProvider>
        <AutoConnectProvider>
          <WalletContextProvider>{children}</WalletContextProvider>
        </AutoConnectProvider>
      </NetworkConfigurationProvider>
    </>
  );
};

// Ghi chú chi tiết:
// Imports: Các thư viện và module cần thiết được nhập vào, bao gồm các adapter ví, provider, và các thành phần từ Solana và React.
// WalletContextProvider: Đây là một component sử dụng FC (Functional Component) từ React, nhận children là các component con mà nó sẽ bao bọc.
// Trạng thái tự động kết nối: Sử dụng hook useAutoConnect để lấy trạng thái tự động kết nối.
// Cấu hình mạng: Sử dụng hook useNetworkConfiguration để lấy cấu hình mạng và chuyển đổi kiểu.
// Tạo endpoint: Sử dụng useMemo để tạo endpoint cho mạng, chỉ cập nhật khi network thay đổi.
// Xác định endpoint: Dựa trên giá trị của network, xác định endpoint cho v.
// Tạo danh sách ví: Sử dụng useMemo để tạo danh sách các adapter ví, chỉ cập nhật khi network thay đổi.
// Xử lý lỗi: Định nghĩa hàm xử lý lỗi, sử dụng notify để hiển thị thông báo lỗi và ghi lỗi vào console.
// Trả về JSX: Component trả về một cấu trúc JSX bao gồm ConnectionProvider, WalletProvider, và ReactUIWalletModalProvider.
