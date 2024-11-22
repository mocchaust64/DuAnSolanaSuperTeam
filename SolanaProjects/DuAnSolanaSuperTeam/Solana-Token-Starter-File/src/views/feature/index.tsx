import React, { FC, Dispatch, SetStateAction } from "react";
import { LuArrowRightFromLine } from "react-icons/lu";
import { MdGeneratingTokens, MdToken } from "react-icons/md";
import { RiTokenSwapFill } from "react-icons/ri";
import { RxTokens } from "react-icons/rx";

interface FeatureviewProps {
  setOpenAirdrop: Dispatch<SetStateAction<boolean>>;
  setOpenContact: Dispatch<SetStateAction<boolean>>;
  setOpenCreateModal: Dispatch<SetStateAction<boolean>>;
  setOpenSendTransaction: Dispatch<SetStateAction<boolean>>;
  setOpenTokenMetaData: Dispatch<SetStateAction<boolean>>;
}

export const Featureview: FC<FeatureviewProps> = ({
  setOpenAirdrop,
  setOpenContact,
  setOpenCreateModal,
  setOpenSendTransaction,
  setOpenTokenMetaData,
}) => {
  const features = [
    {
      name: "Token Generator",
      icon: <MdGeneratingTokens />,
      description: "Tạo token Solana một cách dễ dàng với các công cụ tạo token.",
      function: setOpenCreateModal,
    },
    {
      name: "Get Airdrop",
      icon: <MdToken />,
      description: "Nhận airdrop token Solana miễn phí để bắt đầu dự án của bạn.",
      function: setOpenAirdrop,
    },
    {
      name: "Transfer sol",
      icon: <RiTokenSwapFill />,
      description: "Chuyển solana giữa các ví một cách nhanh chóng và an toàn.",
      function: setOpenSendTransaction,
    },
    {
      name: "Token Metadata",
      icon: <RxTokens />,
      description: "Quản lý và cập nhật thông tin metadata cho token của bạn.",
      function: setOpenTokenMetaData,
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="mb-10 flex items-end justify-between">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-medium capitalze text-white">
              Choose Solana Clockchain generator
            </h2>
            <p className="text-default-200 text-sm font-medium">
              Now you can create Solana token to without code instantly
            </p>
          </div>
        </div>

        <div className="bg-default-950/40 flex flex-wrap items-center rounded-3xl backdrop-blur-3xl">
          {features.map((list, index) => (
            <div
              key={index}
              className={`w-auto grow border-b border-white/10 md:w-1/2 ${
                index === 0
                  ? "md:border-e"
                  : index === 1
                  ? ""
                  : index === 2
                  ? "md:border-e md:border-b-0"
                  : ""
              }`}
            >
              <div className="p-8 sm:p-10">
                <div className="bg-primary/10 text-primary mb-10 inline-flex h-16 w-16 items-center justify-center rounded-xl">
                  <i data-lucide="framer">{list.icon}</i>
                </div>
                <h2 className="mb-4 text-2xl font-medium text-white">
                  {list.name}
                </h2>
                <p className="text-default-200 mb-6 text-base">
                  {list.description}
                </p>
                <a
                  onClick={() => list.function(true)}
                  className="hover:bg-primary inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-6 py-2 text-white transition-all duration-300"
                >
                  Use Tools
                  <i>
                    <LuArrowRightFromLine />
                  </i>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

