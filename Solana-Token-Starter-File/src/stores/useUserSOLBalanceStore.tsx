import create,{State} from "zustand";
import { Connection,PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { error } from "console";

interface UserSOLBalanceStore extends State{
  balance : number;
  getUserSOLBalance: (publickey: PublicKey, connection: Connection)=>void;


}

const useUserSOLBalanceStore = create<UserSOLBalanceStore>((set, _get) => ({
  balance: 0,
  getUserSOLBalance: async(publickey, connection)=> {
    let balance = 0;

    try{
      balance = await connection.getBalance(publickey,"confirmed");
      balance = balance / LAMPORTS_PER_SOL;
    }catch{
      console.log(error);
    }
    set ((s)=> {
      s.balance = balance;
      console.log("balance: ", balance);
    });
  },
}));

export default useUserSOLBalanceStore;