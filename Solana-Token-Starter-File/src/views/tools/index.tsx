import React, { FC, useState } from "react";
import { MdGeneratingTokens } from "react-icons/md";
import { IoIosArrowRoundForward } from "react-icons/io";
import { LuArrowRightFromLine } from "react-icons/lu";



interface Tool {
  name: string;
  icon: JSX.Element;
  onClick: (value: boolean) => void;
}

interface ToolViewProps {
  setOpenAirdrop: (value: boolean) => void;
  setOpenContact: (value: boolean) => void;
  setOpenCreateModal: (value: boolean) => void;
  setOpenSendTransaction: (value: boolean) => void;
  setOpenTokenMetaData: (value: boolean) => void;
  setOpen3DImageGenerator: (value: boolean) => void;
  setOpenBurnModal: (value: boolean) => void;
  setOpenTransferModal: (value: boolean) => void;
}

import { useRouter } from 'next/router';

export const ToolView: FC<ToolViewProps> = ({
  setOpenAirdrop,
  setOpenContact,
  setOpenCreateModal,
  setOpenSendTransaction,
  setOpenTokenMetaData,
  setOpen3DImageGenerator,
  setOpenBurnModal,
  setOpenTransferModal,
}) => {
  const [isTopTokensOpen, setIsTopTokensOpen] = useState(false);
  const router = useRouter();

  const tools: Tool[] = [
    {
      name: "Create Token",
      icon: <MdGeneratingTokens />,
      onClick: () => setOpenCreateModal(true),
    },
    {
      name: "Token Metadata",
      icon: <MdGeneratingTokens />,
      onClick: () => setOpenTokenMetaData(true),
    },
    {
      name: "Contact Us",
      icon: <MdGeneratingTokens />,
      onClick: () => setOpenContact(true),
    },
    {
      name: "Airdrop",
      icon: <MdGeneratingTokens />,
      onClick: () => setOpenAirdrop(true),
    },
    {
      name: "Send Transaction",
      icon: <MdGeneratingTokens />,
      onClick: () => setOpenSendTransaction(true),
    },
    {
      name: "Top Tokens",
      icon: <MdGeneratingTokens />,
      onClick: () => router.push('/topToken'), 
    },
    {
      name: "AI Creates Images",
      icon: <MdGeneratingTokens />,
      onClick: () => setOpen3DImageGenerator(true),
    },
    {
      name: "Burn Token",
      icon: <MdGeneratingTokens />,
      onClick: () => setOpenBurnModal(true),
    },
    {
      name: "Transfer Token",
      icon: <MdGeneratingTokens />,
      onClick: () => setOpenTransferModal(true),
    },
  ];

  return (
    <>
      <section id="tools" className="py-20">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-medium capitalze text-white">
                Solana Powerful Tools
              </h2>
              <p className="text-default-200 text-sm font-medium" style={{ fontFamily: 'Arial' }}>
                Chào mừng bạn đến với bộ công cụ mạnh mẽ của Solana. 
                Chúng tôi cung cấp các công cụ giúp bạn dễ dàng tạo token, 
                quản lý thông tin token và thực hiện các giao dịch. 
                Hãy khám phá và trải nghiệm những tính năng tuyệt vời mà chúng tôi mang lại!
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool, index) => (
              <div className="bg-default-950/40 rounded-xl backdrop-blur-3xl"
                onClick={() => tool.onClick(true)} key={index}>
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className={`inline-flex h-10 w-10 items-center justify-center
                      rounded-lg bf-red-500/20 ${index === 0 ? "text-red-500" : index === 1 ? 
                      "text-sky-500" : index === 2 ? "text-indigo-500" : index === 3 ?
                      "text-yellow-500" : "text-teal-500"
                    }`}>
                      <i data-lucide="dribble" className="">
                        {tool.icon}
                      </i>
                    </div>
                    <h3 className="text-default-200 text-xl font-dedium">
                      {tool.name}
                    </h3>
                  </div>
                  <a className="text-primary group receive inline-flex items-center
                    gap-2">
                    < span className="bg-primary/80 absolute -bottom-0 h-px 2-7/12
                      rounded transition-all duration-500 group-hover:w-full">
                    </span>
                    Select & try
                    <i data-lucide={"move-right"}>
                      <LuArrowRightFromLine />
                    </i>
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <a className="hover:bg-primary-hover bg-primary inline-flex
              items-center justify-center gap-2 rounded-full px-6
              py-2 text-white transition-all duration-500">
              More Tools 
              <i>
                <IoIosArrowRoundForward />
              </i>
            </a>
          </div>
        </div>
      </section>

      
    </>
  );
};