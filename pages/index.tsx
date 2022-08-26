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
const contractID = "9ad25f08-b313-43ce-b539-1d5c72933b0a"

enum CheckoutPage {
  CREATE_WALLET = "CREATE_WALLET",
  CHOOSE_PAYMENT_METHOD = "CHOOSE_PAYMENT_METHOD",
  CHECKOUT_WITH_CARD = "CHECKOUT_WITH_CARD",
  CHECKOUT_WITH_ETH = "CHECKOUT_WITH_ETH",
  PAYMENT_COMPLETE = "PAYMENT_COMPLETE"
}

const Home: NextPage = () => {
  const editionDrop = useEditionDrop(myEditionDropContractAddress);

  // The user's wallet address
  const [recipientWalletAddress, setRecipientWalletAddress] = useState("");

  const [currentPage, setCurrentPage] = useState(CheckoutPage.CREATE_WALLET);

  const [email, setEmail] = useState('');

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

          {(() => {
            switch (currentPage) {
              case CheckoutPage.CREATE_WALLET:
                return <CreateWalletPage setRecipientWalletAddress={setRecipientWalletAddress} setCurrentPage={setCurrentPage} setEmail={setEmail} email={email}/>;
              case CheckoutPage.CHOOSE_PAYMENT_METHOD:
                return <ChoosePaymentMethodPage setCurrentPage={setCurrentPage}/>;
              case CheckoutPage.CHECKOUT_WITH_CARD:
                return <CheckoutWithCardPage recipientWalletAddress={recipientWalletAddress} setCurrentPage={setCurrentPage} email={email}/>;
              case CheckoutPage.CHECKOUT_WITH_ETH:
                return <CheckoutWithEthPage recipientWalletAddress={recipientWalletAddress}setCurrentPage={setCurrentPage} email={email}/>;
              case CheckoutPage.PAYMENT_COMPLETE:
                return <PaymentCompletePage />;
            }
          })()}
        </div>
      </div>
    </div>
    </PaperSDKProvider>
  );
};

export default Home;

const fetchClientSecret = async (
  contractID: string,
  recipientWalletAddress: string,
  email: string
) => {
  try {
    const clientSecretResp = await fetch("/api/create-client-secret", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contractID, recipientWalletAddress, email }),
    });
    return (await clientSecretResp.json()).clientSecret;
  } catch (e) {
    console.log("error fetching the client secret", e);
  }
};

// create wallet page
const CreateWalletPage = (props: {setRecipientWalletAddress: (walletAddress: string) => void, setCurrentPage: (page: CheckoutPage) => void, setEmail: (e: string) => void, email: string}) => {
  const setRecipientWalletAddress = props.setRecipientWalletAddress;
  const setCurrentPage = props.setCurrentPage;
  const setEmail = props.setEmail;
  const email = props.email;

  return (
    <div className={styles.emailContainer}>
      <p >Please enter your email below:</p> 
      <label className={styles.customfield}>
        <input type="email" value={email} onChange={(e) => {setEmail(e.target.value)}}/>
        <span className={styles.placeholder}>Enter Email</span>
      </label>
      <CreateWallet
        emailAddress={email}
        onSuccess={(user: PaperUser) => {
          console.log('CreateWallet callback', user);
          console.log(email);
          setRecipientWalletAddress(user.walletAddress);
          setCurrentPage(CheckoutPage.CHOOSE_PAYMENT_METHOD)
        }}>
        <button className={styles.mainButton}>
          Verify Email
        </button>
      </CreateWallet>
    </div>
  )
}


// choose payment page
const ChoosePaymentMethodPage = (props: {setCurrentPage: (page: CheckoutPage) => void}) => {
  const setCurrentPage = props.setCurrentPage

  return (
    <div>
      <button className={styles.mainButton} onClick={() => setCurrentPage(CheckoutPage.CHECKOUT_WITH_CARD)}>Pay With Card</button>
      <button className={styles.mainButton} onClick={() => setCurrentPage(CheckoutPage.CHECKOUT_WITH_ETH)}>Pay With ETH</button>
    </div>
  )
} 

// pay with card page
const CheckoutWithCardPage = (props: {recipientWalletAddress: string, setCurrentPage: (page: CheckoutPage) => void, email: string}) => {
  const recipientWalletAddress = props.recipientWalletAddress;
  const setCurrentPage = props.setCurrentPage
  const email = props.email
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    fetchClientSecret(contractID, recipientWalletAddress, email).then(
      (clientSecret) => {
        setClientSecret(clientSecret);
      }
    );
  }, [email, recipientWalletAddress]);

  return (
    <div>
      <CheckoutWithCard
        sdkClientSecret={clientSecret}
        options={{
          colorBackground: 'transparent',
          colorPrimary: '#19A8D6',
          colorText: '#fff',
          borderRadius: 6,
      }}
        onPaymentSuccess={(result: { id: string; }) => {
          console.log('PayWithCard callback', result);
          setCurrentPage(CheckoutPage.PAYMENT_COMPLETE)
        }}
      />
    </div>
  )
}

// pay with crypto page
const CheckoutWithEthPage = (props: {recipientWalletAddress: string, setCurrentPage: (page: CheckoutPage) => void, email:string}) => {
  const recipientWalletAddress = props.recipientWalletAddress;
  const setCurrentPage = props.setCurrentPage
  const email = props.email
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    fetchClientSecret(contractID, recipientWalletAddress, email).then(
      (clientSecret) => {
        setClientSecret(clientSecret);
      }
    );
  }, [email, recipientWalletAddress]);

  return (
    <div>
      <CheckoutWithEth
        sdkClientSecret={clientSecret}
        options={{
          colorBackground: 'transparent',
          colorPrimary: '#fff',
          colorText: '#fff',
          borderRadius: 6,
      }}
        onSuccess={(args: {transactionId: string} ) => {
          console.log('PayWithCrypto callback', args);
          setCurrentPage(CheckoutPage.PAYMENT_COMPLETE)
        }}
      />
    </div>
  )
}

// payment complete page
const PaymentCompletePage = () => {
  return (
    <div>
      <p className={styles.spacerBottom}>
        Thanks for claiming the Paper x Web3SF NFT! Hope you enjoyed our 
        workshop and learned how to 10x your paying customers with Web2.5. Click 
        the button below to view your Paper Wallet and view your NFT.
      </p>
      <button className={styles.mainButton}>
        <a href="https://paper.xyz/wallet" target="_blank" rel="noreferrer">
          Paper Wallet
        </a>
      </button>
    </div>
  )
}
