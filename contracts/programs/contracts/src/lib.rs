use anchor_lang::prelude::*;

declare_id!("DiepswP79yxGSaTEC4pF7iJfSKafh5CmmiRGzctjAmnx");

#[program]
pub mod contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
