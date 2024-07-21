'use client';

import { useState, useEffect } from 'react';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { decodeToken, Web3Auth } from "@web3auth/single-factor-auth";

import Loading from "./Loading";

const verifier = "w3a-firebase-awareo";
const clientId = "xxxx_xxxxxxx";

const chainConfig = {
  chainId: "0xaa36a7",
  displayName: "Sepolia Test Network",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  tickerName: "ETH",
  ticker: "ETH",
  decimals: 18,
  rpcTarget: "https://rpc.sepolia.org/",
  blockExplorerUrl: "https://sepolia.etherscan.io/",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3authSfa = new Web3Auth({
  clientId, 
  web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET, 
  usePnPKey: false, 
  privateKeyProvider,
});

type Props = {
  lng: string;
  currentUser: User | null;
  idToken: string;
}

export default function WalletComponent({ lng = "en", currentUser, idToken }: Props) {
  const [isLoggingIn, setIsLoggingIn] = useState(true); // initial auf true gesetzt
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isWeb3AuthInitialized, setIsWeb3AuthInitialized] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        await web3authSfa.init();
        setIsWeb3AuthInitialized(true);
        console.log("Web3Auth initialized");

        // login after initialization
        const idTokenResult = getIdToken();
        console.log("idTokenResult", idTokenResult);
        const { payload } = decodeToken(idTokenResult);
        await web3authSfa.connect({
          verifier,
          verifierId: (payload as any).sub,
          idToken: idTokenResult,
        });
        setIsLoggedIn(true);
        setIsLoggingIn(false);

        // Retrieve user information after successful login
        const userInfo = await web3authSfa.getUserInfo();
        setUserInfo(userInfo);
        uiConsole(userInfo);

      } catch (error) {
        setIsLoggingIn(false);
        console.error("Error during Web3Auth initialization or login:", error);
      }
    };

    init();
  }, []);

  const getIdToken = () => {
    return idToken;
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const getUserInfo = async () => {
    if (!web3authSfa) {
      uiConsole("Web3Auth Single Factor Auth SDK not initialized yet");
      return;
    }
    try {
      const userInfo = await web3authSfa.getUserInfo();
      uiConsole(userInfo);
    } catch (err) {
      console.error("Error getting user info:", err);
      uiConsole("Error getting user info:", err);
    }
  };

  return (
    <div className="bg-white md:w-[700px] rounded-xl p-8">
      <h1 className="mt-20 mb-8 text-3xl font-bold text-center text-gray-800">
        {currentUser?.displayName} - Your Wallet
      </h1>
      {isLoggingIn ? <Loading /> : (
        <>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
          <div id="console" style={{ whiteSpace: "pre-line" }}>
            <p style={{ whiteSpace: "pre-line" }}></p>
          </div>
        </>
      )}
      <div className="flex-container"></div>
    </div>
  );
}
