import React, { useState} from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from 'next/link';

//IMPORT INTERNAL

import{HomeView,
   ToolView,
    Featureview,
     OfferView,
     FaqView,CreateView,
      TokenMetadata,
      ContactView,
       AirdropView,
       DonateView,
       TransferView,
       BurnView}
from "../views"
import ThreeDImageGenerator from "@views/3DImage/3DImageGenerator";


const Home: NextPage = (props) => {
//STATE VARIABLE

const[openCreateModal, setOpenCreateModal] = useState(false);
const[openTokenMetaData, setOpenTokenMetaData] = useState(false);
const[openContact, setOpenContact] = useState(false);
const[openAirdrop, setOpenAirdrop] = useState(false);
const[openSendTransaction, setOpenSendTransaction] = useState(false);
const [open3DImageGenerator, setOpen3DImageGenerator] = useState(false);
const [openBurnModal, setOpenBurnModal] = useState(false);
const [openTransferModal, setOpenTransferModal] = useState(false);




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
     setOpenCreateModel={setOpenCreateModal}/>

   
    <ToolView
    setOpenAirdrop ={setOpenAirdrop}
    setOpenContact={setOpenContact}
    setOpenCreateModal={setOpenCreateModal}
    setOpenSendTransaction={setOpenSendTransaction}
    setOpenTokenMetaData={setOpenTokenMetaData}
    setOpen3DImageGenerator={setOpen3DImageGenerator} // Đảm bảo hàm này được truyền đúng
    setOpenBurnModal={setOpenBurnModal}
    setOpenTransferModal={setOpenTransferModal}
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

<Link href="/marketplace">
  <button className="btn btn-primary">NFT Marketplace</button>
</Link>

{openCreateModal && (
  <div className="new_loader relative h-full bg-slate-900">
    <CreateView setOpenCreateModal={setOpenCreateModal} />
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
 {open3DImageGenerator && ( // Hiển thị form nếu open3DImageGenerator là true
        <div className="new_loader relative h-full bg-slate-900">
          <ThreeDImageGenerator setOpen3DImageGenerator={setOpen3DImageGenerator} />
        </div>
      )}

{openBurnModal && (
  <div className="new_loader relative h-full bg-slate-900">
    <BurnView setOpenBurnModal={setOpenBurnModal} />
  </div>
)}

{openTransferModal && (
  <div className="new_loader relative h-full bg-slate-900">
    <TransferView setOpenTransferModal={setOpenTransferModal} />
  </div>
)}

  </>
)

};

export default Home;