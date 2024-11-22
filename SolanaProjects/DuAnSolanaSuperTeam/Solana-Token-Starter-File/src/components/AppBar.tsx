import {FC} from 'react';
import {LuMenu} from "react-icons/lu";
import NetworkSwitcher from './NetworkSwitcher';
import { useRouter } from 'next/router';


export const AppBar: FC = (props)=>{
  const router = useRouter();

  const menu =[
    {
      name:"Home",
      link:"/#home",
    },
    {
      name:"Tools",
      link:"/#tools",
    },
    {
      name:"Features",
      link:"/#features",
    },
    {
      name:"Game NFT",
      link:"/#gamenft",
    },
    {
      name:"Price",
      link:"/#price",
    },
    {
      name:"Faq",
      link:"/#faq",
    },
    
  ];
return(
  <div>
    <header id="navbar-sticky" className="navbar">
      <div className="container">
        <nav>
          <a href="/" className="logo">
            <img src="/assets/images/logo1.png"
            className="h-10" alt="logo"/>
          </a>
          <div className="ms-auto flex 
          items-center px-2.5 lg:hidden">
            <button className="hs-collapse-toggle
            bg-default-100/5 inline-flex h-9 w-12
            items-center justify-center
            rounded-md border border-white/20"
            type="button"
            data-hs-collapse="#mobileMenu"
            data-hs-type ="collapse"
            ><i data-lucide="menu"
            className="stroke-white">
            <LuMenu/>
            </i>
              </button>
          </div>
          <div className="hs-collapse mx-auto
          mt-2 hidden grow basis-full
          items-center justify-center transition-all duration-300 lg:mt-0
          lg:flex lg:basis-auto "
          id="mobileMenu"
          >

            <ul id="navbar-navlist"
            className="navbar-nav">
              {
                menu.map((list, index)=>(
                  <li className="nav-item" key={index}>
                    <a className="nav-link text-white hover:text-primary-500" onClick={() => router.push(list.link)}>
                      {list.name}
                    </a>
                  </li>
                ))
              }

            </ul>

          </div>

          <NetworkSwitcher/>
        </nav>
      </div>
    </header>
    {props.children}
  </div>
)
};