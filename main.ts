import { Wallet, BigNumber, ethers, } from "ethers";
import { FlashbotsBundleProvider, FlashbotsBundleResolution } from "@flashbots/ethers-provider-bundle";
import dotenv from "dotenv"
import { Base } from "./source/base";
import { TransferERC20 } from "./source/engine"



dotenv.config()

const AUTH_KEY = process.env.AUTHSIGNER || ""
const recipient = process.env.RECIPIENT || ""



const CHAIN_ID = 1
const provider = new ethers.providers.InfuraProvider(CHAIN_ID, process.env.INFURA_API_KEY)
const RPC = 'https://rpc.beaverbuild.org/'




async function main() {

    const authSigner = AUTH_KEY ? new Wallet(AUTH_KEY) : Wallet.createRandom()
    const TeddyProvider = await FlashbotsBundleProvider.create(provider, authSigner, RPC)
    const feeData = await provider.getFeeData()
    const block = await provider.getBlockNumber() //1//
    await provider.getBlock(block);
    const blockDetails = await provider.getBlock(block);
    const baseFeePerGas = blockDetails.baseFeePerGas as BigNumber
    const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(baseFeePerGas, 1)
    await FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock;
    const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas as BigNumber)
    const maxFeePerGas = maxPriorityFeePerGas.add(maxBaseFeeInFutureBlock)

    const wallet2 = new Wallet(process.env.PRIVATE_KEY_EXECUTOR || '', provider)
    const wallet1 = new Wallet(process.env.PRIVATE_KEY_SPONSOR || '', provider)
    const signer1 = wallet1
    const signer2 = wallet2
    const price = maxPriorityFeePerGas.add(maxFeePerGas)
    console.log()
    const sender = '0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3';
    const tokenAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const engine: Base = new TransferERC20(provider, sender, recipient, tokenAddress);
    const sponsoredTransactions = await engine.getSponsoredTransactions();
    const nonce1 = await provider.getTransactionCount(wallet1.address)
    const nonce2 = await provider.getTransactionCount(wallet2.address)

    const minTimestamp = Date.now() / 1000; // Current timestamp in seconds
    const maxTimestamp = minTimestamp + 600; // Valid for the next 10 minutes
    const uuid = ethers.utils.id("unique_bundle_identifier"); // Generate a unique identifier
    const refundPercent = 50; // Example: 50% refund
    const refundRecipient = wallet1.address;



    const targetBlockNumber = (await provider.getBlockNumber());


    const transactionBundle =
    {
        transaction: {
            to: sender,
            type: 2,
            value: price.mul(30000),
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            maxFeePerGas: maxFeePerGas,
            gasLimit: 22000,
            nonce: nonce1,
            chainId: CHAIN_ID,
            blockNumber: targetBlockNumber,
            minTimestamp,
            maxTimestamp,
            uuid,
            refundPercent,
            refundRecipient
        },
        signer: signer1
    }
    const sponsoredTransaction =
        sponsoredTransactions.map((transaction) => {
            return {
                transaction: {
                    ...transaction,
                    type: 2,
                    maxPriorityFeePerGas: maxPriorityFeePerGas,
                    maxFeePerGas: maxFeePerGas,
                    gasLimit: 30000,
                    nonce: nonce2,
                    chainId: CHAIN_ID,
                    blockNumber: targetBlockNumber,
                    minTimestamp,
                    maxTimestamp,
                    uuid,
                    refundPercent,
                    refundRecipient
                },
                signer: signer2
            }
        })



    console.log(transactionBundle)




    const Bundletransactions = [
        transactionBundle,
        ...sponsoredTransaction,

    ];




    const bundleSubmission = await TeddyProvider.sendBundle(Bundletransactions, targetBlockNumber);
    console.log('bundle submitted, waiting');
    if ('error' in bundleSubmission) {
        throw new Error(bundleSubmission.error.message);
    }

    const waitResponse = await bundleSubmission.wait();
    console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`);
    if (waitResponse === FlashbotsBundleResolution.BundleIncluded || waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
        process.exit(0);
    } else {
        console.log({
            bundleStats: await TeddyProvider.getBundleStats(bundleSubmission.bundleHash, targetBlockNumber),
            bundleStatsV2: process.env.AUTH_KEY && (await TeddyProvider.getBundleStatsV2(bundleSubmission.bundleHash, targetBlockNumber)),

        });
    }
}

main()