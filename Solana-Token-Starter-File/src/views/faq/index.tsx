import { FC } from "react";

export const FaqView: FC = ({}) => {
  const questions = [
    {
      question: "Game NFT của tôi có thể chạy trên nền tảng Solana không?",
      answer:
        "Có, game NFT của bạn có thể hoạt động trên nền tảng Solana. Solana là một nền tảng blockchain tốt cho các ứng dụng NFT vì nó cung cấp tốc độ và tính linh hoạt cao.",
      id: "faq-1",
    },
    {
      question: "Tại sao nên sử dụng Solana để xây dựng game NFT?",
      answer:
        "Solana cung cấp một số ưu điểm cho việc xây dựng game NFT, bao gồm tốc độ cao, chi phí thấp, và tính linh hoạt. Nó cũng có một cộng đồng phát triển lớn và tăng trưởngng, giúp bạn dễ dàng tìm kiếm hỗ trợ và trợ giúp.",
      id: "faq-2",
    },
    {
      question: "Bạn có hướng dẫn về việc tích hợp Solana vào game NFT của tôi không?",
      answer:
        "Có, chúng tôi cung cấp một loạt các hướng dẫn và tài liệu về việc tích hợp Solana vào game NFT của bạn. Hãy kiểm tra trang web của chúng tôi để tìm hướng dẫn chi tiết.",
      id: "faq-3",
    },
    {
      question: "Tôi có thể bán NFT trên Solana không?",
      answer:
        "Có, bạn có thể sử dụng Solana để tạo và bán NFT của mình. Solana cung cấp một số công cụ và dịch vụ để giúp bạn bắt đầu.",
      id: "faq-4",
    },
    {
      question: "Tôi cần phải có kinh nghiệm về blockchain để bắt đầu xây dựng game NFT trên Solana?",
      answer:
        "Không, bạn không cần phải có kinh nghiệm về blockchain để bắt đầu. Tuy nhiên, có nhiều kiến thức và kỹ năng mới mà bạn sẽ cần phải học để thành công. Hãy kiểm tra các khóa học và tài liệu trên trang web của chúng tôi để bắt đầu.",
      id: "faq-5",
    },
    {
      question: "Tôi có thể nhận được hỗ trợ từ Solana cho game NFT của tôi không?",
      answer:
        "Có, Solana có một cộng đồng phát triển mạnh mẽ và nhiều nguồn hỗ trợ. Bạn có thể tham gia các diễn đàn, nhóm trên mạng xã hội, và các sự kiện để nhận được sự hỗ trợ từ cộng đồng và các nhà phát triển khác.",
      id: "faq-6",
    },
  ];

  return (
    <section id="faq" className="py-20">
      <div className="container">
        <div className="mb-10 flex items-end justify-between">
          <div mx-auto max-w-2xl text-center>
            <h2 className="mb-4 text-3xl font-medium capitalize text-white">
              Có câu hỏi nào không?
            </h2>
            
          </div>
        </div>
        <div className="mx-auto max-w-3xl">
          <div className="hs-accordion-group space-y-4">
            {questions.map((questions, index) => (
              <div
                key={index}
                className={`hs-accordion bg-default-950/40 overflow-hidden rounded-lg border border-white/10 backdrop-blur-3xl`}
                id={questions.id}
              >
                <button
                  className="hs-accordion-toggle inline-flex items-center justify-between gap-x-3 px-6 py-4 text-left capitalize text-white transactions-all"
                  aria-controls={`faq-accordion-${index + 1}`}
                >
                  <h5 className="flex text-base font-semibold">
                    <i className="me-3 h-5 w-5 stroke-white align-middle"></i>
                    {questions.question}
                  </h5>
                  <i className="hs-accordion-active:-rotate-180 h-4 w-4 transactions-all duration-500"></i>
                </button>

                <div
                  id={`faq-accordion-${index + 1}`}
                  className="hs-accordion-content w-full overflow-hidden transactions-[height] duration-300"
                  aria-labelledby={questions.id}
                >
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-default-300 mb-2 text-sm font-medium">
                      {questions.answer}
                    </p>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}