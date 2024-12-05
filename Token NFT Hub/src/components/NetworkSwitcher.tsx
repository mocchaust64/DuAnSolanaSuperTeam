import { FC } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

// INTERNAL IMPORT
import { useNetworkConfiguration } from "../contexts/NetworkConfigurationProvider";
import NetworkSwitcher from "./SVG/NetworkSwitcherSVG";
import { notify } from "../utils/notifications";

const NetworkSwitcherComponent: FC = () => {
  const { networkConfiguration, setNetworkConfiguration } = useNetworkConfiguration();
  const { disconnect } = useWallet();

  const handleNetworkChange = (value: string) => {
    disconnect();
    setNetworkConfiguration(value || "devnet");
    notify({
      type: "error",
      message: "Vui lòng kết nối lại ví của bạn.",
      description: "Bạn đã thay đổi mạng. Hãy kết nối lại ví để tiếp tục.",
    });
  };

  return (
    <>
      <input type="checkbox" id="checkbox" className="hidden" />
      <label htmlFor="checkbox" className="switch">
        <select
          value={networkConfiguration}
          onChange={(e) => handleNetworkChange(e.target.value)}
          className="select max-w-xs border-none bg-purple-700 text-white rounded-lg transition duration-300 ease-in-out hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="mainnet-beta">Mainnet</option>
          <option value="devnet">Devnet</option>
          <option value="testnet">Testnet</option>
        </select>
      </label>
    </>
  );
};

export default dynamic(() => Promise.resolve(NetworkSwitcherComponent), {
  ssr: false,
});