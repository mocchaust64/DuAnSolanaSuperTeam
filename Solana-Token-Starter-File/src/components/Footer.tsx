import React, { FC } from "react";
import { useForm } from "@formspree/react";
import { TiSocialFacebook, TiSocialLinkedin, TiSocialTwitter, TiSocialYoutube } from "react-icons/ti";

export const Footer: FC = () => {
  const [state, handleSubmit] = useForm("mzbnzpqr");

  if (state.succeeded) {
    return (
      <h1 className="md:text-5xl/tight my-4 max-w-lg text-4xl font-medium text-white">
        cảm ơn bạn!
      </h1>
    );
  }

  const menuOne = [
    "Trung tâm hỗ trợ",
    "Hỗ trợ khách hàng",
    "Giới thiệu",
    "Dự án",
    "Chính sách đổi trả",
  ];
  const menuTwo = [
    "Các câu hỏi về chính sách",
    "Cộng đồng",
    "Hình ảnh & B-rol",
    "Sơ đồ trang web",
  ];

  return (
    <footer className="bg-default-950/40 backdrop-blur-3xl">
      <div className="container py-20 lg:px-20">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
            <ul className="flex flex-col gap-3">
              <h5 className="text-default-200-mb-2 font-medium lg:text-lg xl:text-xl">
                Giới thiệu
              </h5>
              {menuOne.map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-default-300 text-base transition-all hover:text-white">
                    <i data-licide="gauge-circle" className="me-2 inline-block h-4 w-4">
                      
                    </i>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
            <ul className="flex flex-col gap-3">
              <h5 className="text-default-200-mb-2 font-medium lg:text-lg xl:text-xl">
              Về chúng tôi
              </h5>
              {menuTwo.map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-default-300 text-base transition-all hover:text-white">
                    <i data-licide="gauge-circle" className="me-2 inline-block h-4 w-4">
                    
                    </i>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-6">
            <div className="bg-primary/20 rounded-xl">
              <div className="p-10">
                <h6 className="mb-4 text-xl text-white">NewsLetter</h6>
                <p className="text-default-200 mv-6 text-base font-medium" style={{ fontFamily: 'Arial' }}>
                Đăng ký và nhận những thông báo mới nhất
                </p>
                <form onSubmit={handleSubmit} className="mb-6 space-y-2 relative">
                  <label htmlFor="email" className="text-base text-white"></label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                       placeholder="Nhập Email"
                      className="bg-default-950/60 pe-40 ps-4 h-12 w-full rounded-lg border-white/10 py-4 text-white backdrop-blur-3xl focus:border-white/10 focus:ring-0"
                    />
                    <button
                      type="submit"
                      disabled={state.submitting}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-primary-hover hover:border-primary-hover border-primary bg-primary inline-flex h-8 items-center justify-center gap-2 rounded-md px-4 text-white transition-all"
                    >
                      Subscribe
                    </button>
                  </div>
                </form>

                <div>
                  <h6 className="mb-4 text-base text-white">Theo Dõi Chúng Tôi</h6>
                  <ul className="flex flex-wrap items-center gap-1">
                    {[
                      <TiSocialFacebook />,
                      <TiSocialLinkedin />,
                      <TiSocialTwitter />,
                      <TiSocialYoutube />,
                    ].map((social, index) => (
                      <li key={index}>
                        <a
                          href="#"
                          className="hover:bg-primary group inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 transition-all duration-500"
                        >
                          <i data-lucide="facebook" className="text-default-300 group-hover:text-white">
                            {social}
                          </i>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-white/10 py-6">
        <div className="md:text-start container flex h-full flex-wrap items-center justify-center gap-4 text-center md:justify-between lg:px-20">
          <p className="text-default-400 text-base font-medium">
            @ SolanaAi - 
            <a href="#">
              Design & Created <i data-lucide="heart" className="inline h-4 w-4 fill-red-500 text-red-500"></i>
              by @SolanaSuperTeamVietNam
            </a>
          </p>
          <p className="text-default-400 text-base font-medium">
            Terms Conditions & Policy
          </p>
        </div>
      </div>
    </footer>
  );
};