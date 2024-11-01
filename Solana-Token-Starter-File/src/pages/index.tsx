import React, { useState} from "react";
import type { NextPage } from "next";
import Head from "next/head";

//IMPORT INTERNAL

import{HomeView,
   ToolView,
    Featureview,
     OfferView,
     FaqView,CreateView,
      TokenMetadata,
      ContactView,
       AirdropView,
       DonateView}
from "../views"


const Home: NextPage = (props) => {
//STATE VARIABLE

const[openCreateModal, setOpenCreateModal] = useState(false);
const[openTokenMetaData, setOpenTokenMetaData] = useState(false);
const[openContact, setOpenContact] = useState(false);
const[openAirdrop, setOpenAirdrop] = useState(false);
const[openSendTransaction, setOpenSendTransaction] = useState(false);



return(
  <>
  <Head>
    <title>Solana Token Creator</title>
    <meta 
    name="Solana token creator"
    content="Build and create solana token"
    />
 </Head>
    <HomeView
     setOpenCreateModal={setOpenCreateModal}/>

   
    <ToolView
    setOpenAirdrop ={setOpenAirdrop}
    setOpenContact={setOpenContact}
    setOpenCreateModal={setOpenCreateModal}
    setOpenSendTransaction={setOpenSendTransaction}
    setOpenTokenMetaData={setOpenTokenMetaData}
    />

<Featureview
 setOpenAirdrop ={setOpenAirdrop}
 setOpenContact={setOpenContact}
 setOpenCreateModal={setOpenCreateModal}
 setOpenSendTransaction={setOpenSendTransaction}
 setOpenTokenMetaData={setOpenTokenMetaData}
/>
 <OfferView/>
<FaqView/>


{openCreateModal && (
  <div className="new_loader relative h-full bg-slate-900">
    <CreateView setOpenCreateModal = {setOpenCreateModal}/>

  </div>
)}

{openTokenMetaData && (
  <div className="new_loader relative h-full bg-slate-900">
    <TokenMetadata setOpenTokenMetaData = {setOpenTokenMetaData}/>

  </div>
)}

{openContact && (
  <div className="new_loader relative h-full bg-slate-900">
    <ContactView setOpenContact = {setOpenContact}/>

  </div>
)}

{openAirdrop && (
  <div className="new_loader relative h-full bg-slate-900">
    <AirdropView setOpenAirdrop = {setOpenAirdrop}/>

  </div>
)}

{openSendTransaction && (
  <div className="new_loader relative h-full bg-slate-900">
    <DonateView setOpenSendTransaction = {setOpenSendTransaction}/>

  </div>
)} 


 
  </>
)

};

export default Home;