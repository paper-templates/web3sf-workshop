/* eslint-disable @next/next/no-img-element */
import {
  ChainId,
  useContractMetadata,
  useNetwork,
  useActiveClaimCondition,
  useEditionDrop,
  useNFT,
  ThirdwebNftMedia,
  useAddress,
  useMetamask,
  useNetworkMismatch,
  useClaimNFT,
} from "@thirdweb-dev/react";
import { PaperSDKProvider, CheckoutWithCard, CheckoutWithEth, CreateWallet, PaperUser } from "@paperxyz/react-client-sdk";
import { BigNumber } from "ethers";
import { ChangeEvent, useEffect, useState } from "react";
import type { NextPage } from "next";
import styles from "../styles/Theme.module.css";
import "@paperxyz/react-client-sdk/dist/index.css";

// Put Your Edition Drop Contract address from the dashboard here
const myEditionDropContractAddress ="0xf91A07063BDA1458Cb5B327AbeDb31E2666A56Cd";

// Put your contract ID here
const contractID = "9ad25f08-b313-43ce-b539-1d5c72933b0a"

enum CheckoutPage {
  CHOOSE_WALLET = "CHOOSE_WALLET",
  CHOOSE_PAYMENT_METHOD = "CHOOSE_PAYMENT_METHOD",
  CHECKOUT_WITH_CARD = "CHECKOUT_WITH_CARD",
  CHECKOUT_WITH_ETH = "CHECKOUT_WITH_ETH",
  PAYMENT_COMPLETE = "PAYMENT_COMPLETE"
}

const Home: NextPage = () => {
  const editionDrop = useEditionDrop(myEditionDropContractAddress);
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const isOnWrongNetwork = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();

  // The user's wallet address
  const [recipientWalletAddress, setRecipientWalletAddress] = useState("");

  const [currentPage, setCurrentPage] = useState(CheckoutPage.CHOOSE_WALLET);

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
              case CheckoutPage.CHOOSE_WALLET:
                return <ChooseWalletPage setRecipientWalletAddress={setRecipientWalletAddress} setCurrentPage={setCurrentPage} setEmail={setEmail} email={email}/>;
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


// choose wallet page
const ChooseWalletPage = (props: {setRecipientWalletAddress: (walletAddress: string) => void, setCurrentPage: (page: CheckoutPage) => void, setEmail: (e: string) => void, email: string}) => {
  const setRecipientWalletAddress = props.setRecipientWalletAddress;
  const setCurrentPage = props.setCurrentPage;
  const setEmail = props.setEmail;
  const email = props.email;

  return (
    <div>
      <p className={styles.spacerBottom}>Please enter your email below:</p> 
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
    const fetchClientSecret = async () => {
      const clientSecret_ =await fetch('/api/create-client-secret', {
        method: 'POST', 
        body: {contractId, recpeintWalletAddres, email}
      })
      setClientSecret(clientSecret_);
    }

    fetchClientSecret()
  }, [email, recipientWalletAddress])

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

  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const fetchClientSecret = async () => {
      const clientSecret_ = await getClientSecret(recipientWalletAddress, email)
      setClientSecret(clientSecret_);
    }

    fetchClientSecret()
  }, [email, recipientWalletAddress])

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

// pay with crypto page
const PaymentCompletePage = () => {
  return (
    <div>
      <p className={styles.spacerBottom}>Thanks for claiming the Paper x Web3SF NFT! Hope you enjoyed our workshop and learned how to 10x your paying customers with Web2.5. Click the button below to view your Paper Wallet and view your NFT.</p>
      <button className={styles.mainButton}>
        <a href="https://paper.xyz/wallet" target="_blank" rel="noreferrer">
          Paper Wallet
        </a>
      </button>
    </div>
  )
}
