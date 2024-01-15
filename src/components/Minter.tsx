import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ethers } from "ethers";
import abi from "../utils/abi.json";
import {
    IHybridPaymaster,
    SponsorUserOperationDto,
    PaymasterMode,
} from "@biconomy/paymaster";
import { BiconomySmartAccountV2 } from "@biconomy/account";

const nftAddress = process.env.NFT_ADDRESS as string;

interface Props {
    smartAccount: BiconomySmartAccountV2;
    address: string;
    provider: ethers.providers.Provider;
}


const Minter: React.FC<Props> = ({ smartAccount, address, provider }) => {
    const [minted, setMinted] = useState<boolean>(false);
    const handleMint = async () => {
        const contract = new ethers.Contract(nftAddress, abi, provider);
        try {
            console.log({ address });
            console.log({ contract });
            toast.info("Minting your NFT...", {
                position: "top-right",
                autoClose: 15000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
            const minTx = await contract.populateTransaction.safeMint(address);
            console.log(minTx.data);
            const tx1 = {
                to: nftAddress,
                data: minTx.data,
            };
            console.log("here before userop");
            let userOp = await smartAccount.buildUserOp([tx1], {
                paymasterServiceData: {
                    mode: PaymasterMode.SPONSORED,
                }
            });
            console.log({ userOp });
            const biconomyPaymaster =
                smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
            let paymasterServiceData: SponsorUserOperationDto = {
                mode: PaymasterMode.SPONSORED,
                smartAccountInfo: {
                    name: "BICONOMY",
                    version: "2.0.0",
                },
            };
            const paymasterAndDataResponse =
                await biconomyPaymaster.getPaymasterAndData(userOp, paymasterServiceData);

            userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
            const userOpResponse = await smartAccount.sendUserOp(userOp);
            console.log("userOpHash", userOpResponse);
            const { receipt } = await userOpResponse.wait(1);
            console.log("txHash", receipt.transactionHash);
            setMinted(true);
            toast.success(
                `Success! Here is your transaction:${receipt.transactionHash} `,
                {
                    position: "top-right",
                    autoClose: 18000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                },
            );
        } catch (err: any) {
            console.error(err);
            console.log(err);
        }
    };
    return (
        <>
            {address && <button onClick={handleMint}>Mint NFT</button>}
            {minted && <a href={`https://testnets.opensea.io/${address}`}> Click to view minted nfts for smart account</a>}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </>
    )
}
export default Minter;