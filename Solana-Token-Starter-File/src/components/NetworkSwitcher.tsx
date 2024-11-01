import { FC } from "react";
import dynamic from "next/dynamic";

// INTERNAL IMPORT
import { useNetworkConfiguration } from "../contexts/NetworkConfigurationProvider";
import NetworkSwitcher from "./SVG/NetworkSwitcherSVG";

const NetworkSwitcherComponent: FC = () => {
  const { networkConfiguration, setNetworkConfiguration } = useNetworkConfiguration();
  return (
    <>
      <input type="checkbox" id="checkbox" className="hidden" />
      <label htmlFor="checkbox" className="switch">
        <select
          value={networkConfiguration}
          onChange={(e) => setNetworkConfiguration(e.target.value || "devnet")}
          className="select max-w-xs border-none bg-transparent outline-0"
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