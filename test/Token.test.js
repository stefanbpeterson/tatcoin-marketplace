import { tokens, EVM_REVERT } from './helpers'
const Token = artifacts.require('./Token')
require('chai').use(require('chai-as-promised')).should()

contract('Token', ([deployer, receiver, exchange]) => {
    const name = 'Art Token'
    const symbol = 'ART'
    const decimals = '18'
    const totalSupply = tokens(1000000).toString()
    let token;

    describe('deployment', () => {
        beforeEach(async() => {
            // Fetches token from the blockchain
            token = await Token.new()
        })

        it('tracks the name', async() => {
            // Read token name here
            const result = await token.name()
            // Check the token name is the same as the name in the smart contract for the token
            result.should.equal(name)
        })

        it('tracks the symbol', async() => {
            const result = await token.symbol()
            result.should.equal(symbol)
        })

        it('tracks the decimals', async() => {
            const result = await token.decimals()
            result.toString().should.equal(decimals)
        })

        it('tracks the total supply', async() => {
            const result = await token.totalSupply()
            result.toString().should.equal(totalSupply.toString())
        })

        it('assigns the total supply to the deployer', async() => {
            const result = await token.balanceOf(deployer)
            result.toString().should.equal(totalSupply.toString())
        })
    })

    describe('sending tokens', () => {
        let amount
        let result

        describe('success', async () => {
            beforeEach(async() => {
                amount = tokens(100)
                // Transfer
                result = await token.transfer(receiver, amount, { from: deployer })
            })
    
            it('transfers token balances', async() =>{
                let balanceOf
    
                // After transfer
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(100).toString())
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
            })
    
            it('emits a Transfer event', async() => {
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.eq(deployer, 'from value is correct')
                event.to.toString().should.eq(receiver, 'to value is correct')
                event.value.toString().should.eq(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async () => {
            it('rejects insufficient balances', async () => {
                let invalidAmount
                invalidAmount = tokens(100000000) // 100 million - greater than total supply
                await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(EVM_REVERT)

                // Attempt to transfer tokens when you have none
                invalidAmount = tokens(100000000) // recipient has no tokens
                await token.transfer(deployer, invalidAmount, { from: receiver }).should.be.rejectedWith(EVM_REVERT)
            })
            // Rejects invalid recipients
            it('rejects invalid recipients', async() => {
                await token.transfer(0x0, amount, { from: deployer }).should.be.rejected
            })
        })
    })

    describe('approving tokens', () => {
        let result
        let amount

        beforeEach(async() => {
            amount = tokens(100)
            result = await token.approve(exchange, amount, { from: deployer })
        })

        describe('success', () => {
            it('allocates an allowance for delegated token spending on an exchange', async() => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal(amount.toString())
            })

            it('emits an Approval event', async() => {
                const log = result.logs[0]
                log.event.should.eq('Approval')
                const event = log.args
                event.owner.toString().should.eq(deployer, 'owner is correct')
                event.spender.toString().should.eq(exchange, 'spender is correct')
                event.value.toString().should.eq(amount.toString(), 'value is correct')
            })

        })
        

        describe('failure', () => {
            it('rejects invalid spenders', async() => {
                await token.approve(0x0, amount, { from: deployer }).should.be.rejected
            })
        })
    })

    describe('delegated token transfers', async() => {
        let amount
        let result

        beforeEach(async() => {
            amount = tokens(100)
            await token.approve(exchange, amount, { from: deployer })
        })

        describe('success', async() => {
            beforeEach(async() => {
                // Transfer
                result = await token.transferFrom(deployer, receiver, amount, { from: exchange })
            })
    
            it('transfers token balances', async() =>{
                let balanceOf
    
                // After transfer
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999700).toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(300).toString())
            })

            it('resets the allowance', async() => {
                const allowance = await token.allowance(deployer, exchange)
                allowance.toString().should.equal('0')
            })
    
            it('emits a Transfer event', async() => {
                const log = result.logs[0]
                log.event.should.eq('Transfer')
                const event = log.args
                event.from.toString().should.eq(deployer, 'from value is correct')
                event.to.toString().should.eq(receiver, 'to value is correct')
                event.value.toString().should.eq(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async() => {
            // Fails when too many tokens are attempted to be transferred
            it('rejects insufficient balances', async () => {
                const invalidAmount = tokens(100000000)
                await token.transferFrom(deployer, receiver, invalidAmount, { from: exchange }).should.be.rejectedWith(EVM_REVERT)
            })
            // Fails if transaction recipient is invalid
            it('rejects invalid recipients', async() => {
                await token.transferFrom(deployer, 0x0, amount, { from: exchange }).should.be.rejected
            })
        })
    })
})