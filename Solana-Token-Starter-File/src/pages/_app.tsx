import { AppProps } from "next/app";
import Head from "next/head";
import { FC } from "react";
import { ContextProvider } from "../contexts/ContextProvider";
import { AppBar } from "../components/AppBar";
import Notification from "../components/Notification";
import { Footer } from "../components/Footer";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";
import { useRouter } from 'next/router';
import '@/styles/marketplace.css';
import '@/styles/animations.css';

require("@solana/wallet-adapter-react-ui/styles.css");
require("../styles/globals.css");
import '../views/3DImage/ThreeDImageGenerator.css';

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  
  // Kiểm tra nếu đang ở các route marketplace
  const isMarketplacePage = router.pathname.includes('/marketplace');

  return (
    <div className="bg-default-900" suppressHydrationWarning>
      <Head>
        <title>Solana Token Creator</title>
      </Head>

      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <ContextProvider>
              {/* Chỉ hiện AppBar khi không phải ở marketplace */}
              {!isMarketplacePage && <AppBar />}
              <Notification />
              <Component {...pageProps} />
              <Footer />
            </ContextProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
};

export default App;
