import { useForm, ValidationError } from "@formspree/react";
import { AiOutlineClose } from "react-icons/ai";
import { notify } from "../../utils/notifications";
import Branding from "../../components/Branding";
import NotificationList from "@components/Notification";
import React, { FC, useState, useRef } from "react";

interface ContactViewProps {
  setOpenContact: (value: boolean) => void;
}

export const ContactView: FC<ContactViewProps> = ({ setOpenContact }) => {
  const [state, handleSubmit] = useForm("xqakpljw");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [messageError, setMessageError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const validateForm = (email: string, message: string) => {
    let isValid = true;
    setEmailError("");
    setMessageError("");

    if (!email) {
      setEmailError("Email không được để trống");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email không hợp lệ");
      isValid = false;
    }

    if (!message) {
      setMessageError("Nội dung không được để trống");
      isValid = false;
    }

    return isValid;
  };

  const onSubmitSuccess = () => {
    notify({
      type: "success",
      message: "Cảm ơn bạn đã gửi tin nhắn, chúng tôi sẽ phản hồi sớm.",
    });
    setTimeout(() => {
      setEmail("");
      setMessage("");
      setEmailError("");
      setMessageError("");
    }, 2000);
  };

  const handleSubmitWithSuccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm(email, message)) {
      return;
    }

    const result = await handleSubmit(event);

    if (state.succeeded) {
      onSubmitSuccess();
    } else {
      console.error("Lỗi trong quá trình gửi form:", state.errors || "Không có thông tin lỗi");
      console.log("Chi tiết state:", state);
    }
  };

  const CloseModal = () => (
    <a
      onClick={() => setOpenContact(false)}
      className="group mt-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-2xl transition-all duration-500 hover:bg-blue-600/60"
    >
      <i className="text-2xl text-white group-hover:text-white">
        <AiOutlineClose />
      </i>
    </a>
  );

  return (
    <>
    <div className="fixed top-0 left-0 w-full z-50">
    <NotificationList />
    </div>
    
      <div>
        <section className="flex w-full items-center py-6 px-0 lg:h-screen lg:p-10">
          <div className="container">
            <div className="bg-default-950/40 mx-auto max-w-5xl overflow-hidden rounded-2xl backdrop-blur-2xl">
              <div className="grid gap-10 lg:grid-cols-2">
                <Branding
                  image="auth-img"
                  title="Liên hệ với chúng tôi"
                  message="Hãy gửi tin nhắn cho chúng tôi để biết thêm chi tiết về dự án sắp ra mắt"
                />
                <div className="lg:ps-0 flex h-full flex-col p-10">
                  <div className="pb-10">
                    <a className="flex">
                      <img src="assets/images/logo1.png" alt="logo" className="h-10" />
                    </a>
                  </div>
                  <div className="my-auto pb-6 text-center">
                    <h4 className="mb-4 text-2xl font-bold text-white">
                      Send email to us for more details
                    </h4>
                    <p className="text-default-300 mx-auto mb-5 max-w-sm">
                      Send your message so we can provide you more details
                    </p>
                    <div className="text-start">
                      <form onSubmit={handleSubmitWithSuccess}>
                        <div className="mb-4">
                          <label className="text-base/normal text-default-200 mb-2 block font-semibold">
                            Email
                          </label>
                          <input
                            type="email"
                            ref={emailRef}
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border-default-200 block w-full rounded border-white/25 focus:ring-transparent"
                            placeholder="email"
                          />
                          <ValidationError prefix="Email" field="email" errors={state.errors} />
                          {emailError && <label className="text-red-500">{emailError}</label>}
                        </div>
                        <textarea
                          name="message"
                          ref={messageRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="border-default-200 relative block w-full rounded border-white/25 focus:ring-transparent"
                          placeholder="message"
                        ></textarea>
                        <ValidationError prefix="Message" field="message" errors={state.errors} />
                        {messageError && <label className="text-red-500">{messageError}</label>}
                        <div className="mb-6 text-center mt-4">
                        {state.succeeded && <label className="text-green-500 mt-4 mb-2">Cảm ơn bạn đã gửi tin nhắn!</label>}
                      {state.errors && Object.keys(state.errors).length > 0 && (
                            <label className="text-red-500">Có lỗi xảy ra khi gửi form. Vui lòng kiểm tra lại.</label>
                          )}
                          <button
                            type="submit"
                            disabled={state.submitting}
                            className="bg-primary-600/90 hover:bg-primary-600 group mt-5 inline-flex w-full items-center justify-center rounded-lg px-6 py-2 text-white backdrop-blur-2xl transition-all duration-500"
                          >
                            <span className="fw-bold">Send Message</span>
                          </button>
                          
                          <CloseModal />
                        </div>
                      </form>
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ContactView;