import{FC} from "react";

export const FaqView: Fc =({})=> {
  const questions = [
    {
      question: " Who are produces sit pleasure?",
      answer:
        " Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
      id: "faq-1",
    },
    {
      question: " What is quo voluptas nulla pariatur?",
      answer:
        "Vivamus elementum semper nisi. Aenean vulputate eleifendtellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet.",
      id: "faq-2",
    },
    {
      question: "How to do transactions using iMbank?",
      answer:
        " Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
      id: "faq-3",
    },
    {
      question: " hot to activate iMbank service?",
      answer:
        "Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
      id: "faq-4",
    },
    {
      question: "  Who is eligible to open iMbank account?",
      answer:
        "Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
      id: "faq-5",
    },
    {
      question: "wil i be given a passbook?",
      answer:
        "Aenean commodo ligula eget dolor. Aenean massa. Cum sociisnatoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
      id: "faq-6",
    },
  ];

  return (

    <section id="faq" className="py-20">
      <div className="container">
        <div className="mb-10 flex items-end justify-between">
          <div mx-auto max-w-2xl text-center>

            <h2 className="mb-4 text-3xl font-medium capitalize text-white">
              Any Question

            </h2>
            <p className="text-default-200 text-sm font-medium">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. 
            </p>

          </div>

        </div>
        <div className="mx-auto max-w-3xl">
          <div className="hs-accordion-group space-y-4">
            {questions.map((questions, index)=>(
              <div key={index}
              className={`hs-accordion bg-default-950/40 overflow-hidden
              rounded-lg border border-white/10 backdrop-blur-3xl`}
              id={questions.id}>
                <button className="hs-accordion-toggle inlie-flex items-center
                justify-between gap-x-3 px-6 py-4 text-left capitalize 
                text-white transactions-all"
                aria-controls={`faq-accordion-${index+1}`}>
                  <h5 className="flex text-base font-semibold">
                    <i className="me-3 h-5 w-5 stroke-white align-middle">

                    </i>
                    {questions.question}

                  </h5>
                  <i className="hs-accordion-active:-ro
                  tate-180 h-4 w-4 transactions-all duration-500">

                  </i>

                </button>

                <div id={`faq-accordion-${index +1}`}
                className="hs-accordion-content w-full overflow-hidden 
                transactions-[height] duration-300"
                aria-labelledby ={questions.id}>
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-default-300
                    mb-2 text-sm font-medium">
                      {questions.answer}

                    </p>
                    <p className="text-default-300 text-sm font-medium">
                      Have you ever wentd to become blockchain developer 
                      check the pro NFT Marketplace Course

                    </p>

                  </div>

                </div>


              </div>
            ))

            }

          </div>

        </div>

      </div>

    </section>
  );
}



