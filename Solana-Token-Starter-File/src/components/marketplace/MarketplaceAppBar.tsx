// src/components/marketplace/MarketplaceAppBar.tsx
import { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LuMenu } from 'react-icons/lu';
import NetworkSwitcher from '../NetworkSwitcher';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css'); // Add wallet styles

export const MarketplaceAppBar: FC = (props) => {
  const router = useRouter();

  const menu = [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "Browse NFTs",
      link: "/marketplace",
    },
    {
      name: "Mint NFT",
      link: "/marketplace/mint",
    },
    {
      name: "Create Collection",
      link: "/marketplace/collections/create",
    },
    {
      name: "My NFTs",
      link: "/marketplace/my-nfts", 
    },
    {
      name: "Setup Marketplace",
      link: "/marketplace/setup",
    },
    {
      name: "Faq",
      link: "/marketplace/faq",
    },
  ];

  return (
    <div>
      <header className="navbar fixed top-0 left-0 w-full z-10 bg-gray-900/95 backdrop-blur-sm min-h-[80px]">
        <div className="container mx-auto px-6">
          <nav className="relative flex items-center justify-between py-6">
            <Link href="/">
              <div className="logo flex items-center"> {/* Wrap content in a div */}
                <img 
                  src="/assets/images/logo1.png"
                  className="h-12" 
                  alt="logo" 
                />
              </div>
            </Link>
            
            <div className="ms-auto flex items-center px-2.5 lg:hidden">
              <button 
                className="hs-collapse-toggle flex h-9 w-12 items-center justify-center rounded-md border border-white/20 bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300"
                type="button"
                data-hs-collapse="#mobileMenu"
                data-hs-type="collapse"
              >
                <LuMenu className="text-white" />
              </button>
            </div>

            <div className="hs-collapse mx-auto hidden grow basis-full items-center justify-center lg:flex lg:basis-auto"
              id="mobileMenu">
              <ul className="navbar-nav flex space-x-8">
                {menu.map((item, index) => (
                  <li key={index} className="relative group">
                    <Link href={item.link}>
                      <span className={`nav-link text-base font-medium transition-all duration-300 hover:text-white
                        ${router.pathname === item.link ? 'text-white' : 'text-white/80'}`}
                      >
                        {item.name}
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center space-x-6">
              <NetworkSwitcher />
            </div>
          </nav>
        </div>
      </header>

      <div className="pt-28">
        {props.children}
      </div>

      
    </div>
  );
};