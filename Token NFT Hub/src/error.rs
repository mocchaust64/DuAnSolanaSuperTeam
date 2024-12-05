use anchor_lang::prelude::*;

#[error_code]
pub enum TokenRegistryError {
    #[msg("Invalid program owner")]
    InvalidProgramOwner,
    #[msg("Invalid token owner")]
    InvalidTokenOwner,
}