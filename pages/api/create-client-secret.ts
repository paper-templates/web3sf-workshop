import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { contractID, recipientWalletAddress, email } = req.body;
  const clientSecret = await getClientSecret(
    contractID,
    recipientWalletAddress,
    email
  );
  return res.status(200).json({ clientSecret });
}

//create checkout sdk intent
const getClientSecret = async (
  contractID: string,
  recipientWalletAddress: string,
  email: string
) => {
  try {
    const options = {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAPER_API_KEY}`,
      },
      body: JSON.stringify({
        quantity: 1,
        metadata: {},
        expiresInMinutes: 30,
        contractArgs: {
          tokenId: "0",
        },
        contractId: contractID,
        walletAddress: recipientWalletAddress,
        email: email,
      }),
    };

    const response = await fetch(
      "https://paper.xyz/api/2022-08-12/checkout-sdk-intent",
      options
    );
    const jsonResponse = await response.json();

    return jsonResponse.sdkClientSecret;
  } catch (e) {
    console.log("error fetching the client secret", e);
  }
};
