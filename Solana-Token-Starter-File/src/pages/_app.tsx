import { AppProps } from "next/app";
import Head from "next/head";
import { FC } from "react";
import { ContextProvider } from "../contexts/ContextProvider"; // Đảm bảo đường dẫn đúng
import { AppBar } from "../components/AppBar"; // Sửa đổi để sử dụng xuất có tên
import Notification from "../components/Notification";
import { Footer } from "../components/Footer";

require("@solana/wallet-adapter-react-ui/styles.css");
require("../styles/globals.css");
import '../views/3DImage/ThreeDImageGenerator.css'; // Đảm bảo đường dẫn đúng



const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <div className="bg-default-900" suppressHydrationWarning>
      <Head>
        <title> Solana Token Creator </title>
      </Head>
      
      <ContextProvider>
      
        <AppBar />
        <Notification/>
        <Component {...pageProps} /> 
        
       <Footer/>
      </ContextProvider>
      {/* SCRiPTS */}
     
    </div>
  )
}
export default App;
