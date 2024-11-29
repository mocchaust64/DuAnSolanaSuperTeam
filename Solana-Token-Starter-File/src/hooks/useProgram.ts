import { useConnection } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import idl from '../idl/your_program.json' // Update path to your IDL

export const useProgram = () => {
  const { connection } = useConnection()
  
  const provider = new AnchorProvider(
    connection,
    window.solana,
    AnchorProvider.defaultOptions()
  )

  const programId = new PublicKey('Your_Program_ID') // Update with your program ID
  const program = new Program(idl, programId, provider)

  return { program }
}