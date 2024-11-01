import { AppProps } from "next/app";
import Head from "next/head";
import { FC } from "react";
import { ContextProvider } from "../contexts/ContextProvider"; // Đảm bảo đường dẫn đúng
import { AppBar } from "../components/AppBar"; // Sửa đổi để sử dụng xuất có tên
import Notification from "../components/Notification";
import { Footer } from "../components/Footer";

require("@solana/wallet-adapter-react-ui/styles.css");
require("../styles/globals.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <div className="bg-default-900">
      <Head>
        <title> Solana Token Creator </title>
      </Head>
      <ContextProvider>
       
        <Notification>

        </Notification>
        <AppBar />
        <Component {...pageProps} /> 
       <Footer/>
      </ContextProvider>
      {/* SCRiPTS */}
      <script src="assets/libs/preline/preline.js"></script>
      <script src="assets/libs/swiper/swiper-bundle.min.js"></script>
      <script src="assets/libs/gumshoejs/gumshoejs.polyfills.min.js"></script>
      <script src="assets/libs/lucide/lucide.min.js"></script>
      <script src="assets/libs/aos/aos.js"></script>
      <script src="assets/libs/js/swiper.js"></script>
      <script src="assets/libs/js/them.js"></script>
    </div>
  )
}
export default App;
