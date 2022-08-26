/* eslint-disable @next/next/no-img-element */
import {
  useContractMetadata,
  useActiveClaimCondition,
  useEditionDrop,
  useNFT,
  ThirdwebNftMedia,
} from "@thirdweb-dev/react";
import { PaperSDKProvider, CheckoutWithCard, CheckoutWithEth, CreateWallet, PaperUser } from "@paperxyz/react-client-sdk";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import type { NextPage } from "next";
import styles from "../styles/Theme.module.css";
import "@paperxyz/react-client-sdk/dist/index.css";

// Put Your Edition Drop Contract address from the dashboard here
const myEditionDropContractAddress ="0xf91A07063BDA1458Cb5B327AbeDb31E2666A56Cd";

// Put your contract ID here
const contractID = ""


const Home: NextPage = () => {
  const editionDrop = useEditionDrop(myEditionDropContractAddress);

  // Load contract metadata
  const { data: contractMetadata } = useContractMetadata(myEditionDropContractAddress);

  // Load (and cache) the metadata for the NFT with token ID 0
  const { data: nftMetadata } = useNFT(editionDrop, 0);

  // Load the active claim condition
  const { data: activeClaimCondition } = useActiveClaimCondition(
    editionDrop,
    BigNumber.from(0)
  );

  // Loading state while we fetch the metadata
  if (!editionDrop || !contractMetadata) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <PaperSDKProvider chainName='Goerli'>
    <div className={styles.container}>
      <div className={styles.header}>
        <img
          src={`/event-logo.png`}
          alt="Paper Logo"
          width={380}
          className={styles.logo}
        />
      </div>
      <div className={styles.mintInfoContainer}>
        <div className={styles.imageSide}>
          {/* Image Preview of NFTs */}
          <ThirdwebNftMedia
            // @ts-ignore
            metadata={nftMetadata?.metadata}
            className={styles.image}
          />

          {/* Amount claimed so far */}
          <div className={styles.mintCompletionArea}>
            <div className={styles.mintAreaLeft}>
              <p>Total Minted:</p>
            </div>
            <div className={styles.mintAreaRight}>
              {activeClaimCondition ? (
                <p>
                  {/* Claimed supply so far */}
                  <b>{activeClaimCondition.currentMintSupply}</b>
                  {" / "}
                  {activeClaimCondition.maxQuantity}
                </p>
              ) : (
                // Show loading state if we're still loading the supply
                <p>Loading...</p>
              )}
            </div>
          </div>          
        </div>

        <div className={styles.infoSide}>
          {/* Title of your NFT Collection */}
          <p className={styles.infoTitle}>{nftMetadata?.metadata.name}</p>
          {/* Description of your NFT Collection */}
          <p className={styles.description}>{nftMetadata?.metadata.description}</p>
        </div>
      </div>
    </div>
    </PaperSDKProvider>
  );
};

export default Home;
