use anchor_lang::prelude::*;

declare_id!("APEPLOYee1111111111111111111111111111111111");

#[program]
pub mod apeployed {
    use super::*;

    /// Initialize the vault treasury
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        authority: Pubkey,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = authority;
        vault.total_distributed = 0;
        vault.total_collected = 0;
        vault.bump = ctx.bumps.vault;
        msg!("Vault initialized with authority: {}", authority);
        Ok(())
    }

    /// Collect fees from Pump.fun creator fees
    pub fn collect_fees(
        ctx: Context<CollectFees>,
        amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        // Transfer SOL from fee collector to vault
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.fee_collector.key(),
            &ctx.accounts.vault.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.fee_collector.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;

        vault.total_collected += amount;
        msg!("Collected {} lamports from fee collector", amount);
        Ok(())
    }

    /// Distribute earnings to a worker
    pub fn distribute_earnings(
        ctx: Context<DistributeEarnings>,
        amount: u64,
        worker_pubkey: Pubkey,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let vault_balance = ctx.accounts.vault.lamports();

        require!(
            vault_balance >= amount,
            ApeployError::InsufficientVaultBalance
        );

        // Transfer SOL from vault to worker
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.worker.try_borrow_mut_lamports()? += amount;

        vault.total_distributed += amount;

        // Record the payment
        let payment = &mut ctx.accounts.payment;
        payment.worker = worker_pubkey;
        payment.amount = amount;
        payment.timestamp = Clock::get()?.unix_timestamp;
        payment.vault_bump = ctx.bumps.vault;

        msg!("Distributed {} lamports to {}", amount, worker_pubkey);
        Ok(())
    }

    /// Update vault authority
    pub fn update_authority(
        ctx: Context<UpdateAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = new_authority;
        msg!("Vault authority updated to: {}", new_authority);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(authority: Pubkey)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Vault::LEN,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CollectFees<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    /// CHECK: Fee collector account (could be Pump.fun treasury)
    pub fee_collector: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(worker_pubkey: Pubkey)]
pub struct DistributeEarnings<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = authority,
        space = 8 + Payment::LEN,
        seeds = [b"payment", worker_pubkey.as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub payment: Account<'info, Payment>,

    #[account(
        constraint = vault.authority == authority.key() @ ApeployError::Unauthorized
    )]
    pub authority: Signer<'info>,

    /// CHECK: Worker wallet address
    #[account(mut)]
    pub worker: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump,
        constraint = vault.authority == authority.key() @ ApeployError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    pub authority: Signer<'info>,
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub total_distributed: u64,
    pub total_collected: u64,
    pub bump: u8,
}

impl Vault {
    pub const LEN: usize = 32 + 8 + 8 + 1;
}

#[account]
pub struct Payment {
    pub worker: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub vault_bump: u8,
}

impl Payment {
    pub const LEN: usize = 32 + 8 + 8 + 1;
}

#[error_code]
pub enum ApeployError {
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid payment amount")]
    InvalidPaymentAmount,
}
