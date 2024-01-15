"use client"
import Image from 'next/image';
import React, { useState } from 'react';
import { ParticleAuthModule, ParticleProvider } from "@biconomy/particle-auth";
import { ethers } from 'ethers';
import { IBundler, Bundler } from "@biconomy/bundler";
import {
  BiconomySmartAccountV2,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { ChainId } from "@biconomy/core-types";
import { IPaymaster, BiconomyPaymaster } from "@biconomy/paymaster";
import {
  ECDSAOwnershipValidationModule,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
} from "@biconomy/modules";
import Minter from '../components/Minter';
import { PolygonMumbai } from "@particle-network/chains";

export default function Home() {
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(
    null,
  );
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(
    null,
  );

  const particle = new ParticleAuthModule.ParticleNetwork({
    chainId: PolygonMumbai.id,
    chainName: PolygonMumbai.name,
    projectId: process.env.PROJECT_ID as string,
    clientKey: process.env.CLIENT_KEY as string,
    appId: process.env.APP_ID as string,
    wallet: {
      displayWalletEntry: true,
      defaultWalletEntryPosition: ParticleAuthModule.WalletEntryPosition.BR,
    },
  });
  const bundler: IBundler = new Bundler({
    bundlerUrl: process.env.BUNDLER_URL as string,
    chainId: ChainId.POLYGON_MUMBAI,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  })

  const paymaster: IPaymaster = new BiconomyPaymaster({
    paymasterUrl: process.env.PAYMASTER_URL as string,
  })

  const connect = async () => {
    try {
      setLoading(true);
      const userInfo = await particle.auth.login();
      console.log("Logged in user:", userInfo);
      const particleProvider = new ParticleProvider(particle.auth);
      const web3Provider = new ethers.providers.Web3Provider(
        particleProvider,
        "any",
      );
      setProvider(web3Provider);

      const modulez = await ECDSAOwnershipValidationModule.create({
        signer: web3Provider.getSigner(),
        moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
      });

      let biconomySmartAccount = await BiconomySmartAccountV2.create({
        chainId: ChainId.POLYGON_MUMBAI,
        bundler: bundler,
        paymaster: paymaster,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        defaultValidationModule: modulez,
        activeValidationModule: modulez,
      });
      setAddress(await biconomySmartAccount.getAccountAddress());
      setSmartAccount(biconomySmartAccount);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="flex min-h-screen min-w-full flex-col items-center justify-between p-24">
      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-1 lg:text-left">
        <div className="group rounded-lg border px-5 py-4 border-gray-30">
          <h1>Based Account Abstraction</h1>
          <br />
          <h2>Connect and Mint your AA powered NFT now</h2>
          <br />
          {!loading && !address && <button onClick={connect}>Connect to Based Web3</button>}
          <br />
          {loading && <p>Loading Smart Account...</p>}
          {address && <h2>Smart Account: {address}</h2>}
          <br />
          {smartAccount && provider && <Minter smartAccount={smartAccount} address={address} provider={provider} />}
        </div>
      </div>
    </main>
  )
}
