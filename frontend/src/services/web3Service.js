import Web3 from 'web3';

let web3;
let initialized = false;

// Web3 instance oluşturma
export const initWeb3 = async () => {
  if (initialized) return true;
  
  try {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      
      try {
        // Erişim izni isteme
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        initialized = true;
        return true;
      } catch (error) {
        console.error("Kullanıcı erişim izni vermedi:", error);
        return false;
      }
    } else if (window.web3) {
      // Legacy dapp browsers
      web3 = new Web3(window.web3.currentProvider);
      initialized = true;
      return true;
    } else {
      // Fallback - local provider (Ganache)
      const provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(provider);
      initialized = true;
      return true;
    }
  } catch (error) {
    console.error("Web3 başlatma hatası:", error);
    return false;
  }
};

// Hesap bilgilerini al
export const getAccounts = async () => {
  if (!initialized) {
    await initWeb3();
  }
  try {
    return await web3.eth.getAccounts();
  } catch (error) {
    console.error("Hesap bilgisi alma hatası:", error);
    throw error;
  }
};

// ETH bakiyesini kontrol et
export const getEthBalance = async (address) => {
  if (!initialized) {
    await initWeb3();
  }
  try {
    const balance = await web3.eth.getBalance(address);
    return web3.utils.fromWei(balance, 'ether');
  } catch (error) {
    console.error("ETH bakiyesi alma hatası:", error);
    throw error;
  }
};

export default web3;