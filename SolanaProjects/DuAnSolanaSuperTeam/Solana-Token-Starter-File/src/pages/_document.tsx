import Document, {
    DocumentContext,
    Head,
    Html,
    Main,
    NextScript
} from "next/document";

class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx);
        return initialProps;
    }

    render() {
        return (
            <Html>
                <Head>
                    <link rel="stylesheet" href="assets/images/favicon.ico" />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                    <script
                        src="https://unpkg.com/lucide@0.284.0/dist/umd/lucide.min.js"
                        defer
                    />
                    <script
                        src="/assets/libs/preline/preline.js"
                        defer
                    />
                    <script
                        src="/assets/libs/swiper/swiper-bundle.min.js"
                        defer
                    />
                    <script
                        src="/assets/libs/aos/aos.js"
                        defer
                    />
                </body>
            </Html>
        );
    }
}

export default MyDocument;