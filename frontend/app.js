"use strict";

/**
 * Example JavaScript code that interacts with the page and Web3 wallets
 */

// Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

// Web3modal instance
let web3Modal

// Chosen wallet provider given by the dialog window
let provider;


// Address of the selected account
let selectedAccount;

let web3;

const contractAbi = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_trackingNumber",
        "type": "uint256"
      },
      {
        "name": "_receiver",
        "type": "address"
      },
      {
        "name": "_status",
        "type": "string"
      },
      {
        "name": "_location",
        "type": "string"
      }
    ],
    "name": "createShipment",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_trackingNumber",
        "type": "uint256"
      },
      {
        "name": "_status",
        "type": "string"
      },
      {
        "name": "_location",
        "type": "string"
      }
    ],
    "name": "updateShipment",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_trackingNumber",
        "type": "uint256"
      }
    ],
    "name": "getShipment",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "string"
      },
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
]


/**
 * Setup the orchestra
 */
function init() {

  console.log("Initializing example");
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("Fortmatic is", Fortmatic);
  console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available
  // if(location.protocol !== 'https:') {
  //   // https://ethereum.stackexchange.com/a/62217/620
  //   const alert = document.querySelector("#alert-error-https");
  //   alert.style.display = "block";
  //   document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  //   return;
  // }

  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        infuraId: "8043bb2cf99347b1bfadfb233c5325c0",
      }
    },

    fortmatic: {
      package: Fortmatic,
      options: {
        // Mikko's TESTNET api key
        key: "pk_test_391E26A3B43A3350"
      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: true, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });

  console.log("Web3Modal instance is", web3Modal);
}


/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {

  // Get a Web3 instance for the wallet
  web3 = new Web3(provider);

  console.log("Web3 instance is", web3);

  // Get connected chain id from Ethereum node
  const chainId = await web3.eth.getChainId();
  // Load chain information over an HTTP API
  const chainData = evmChains.getChain(chainId);
  document.querySelector("#network-name").textContent = chainData.name;

  // Get list of accounts of the connected wallet
  const accounts = await web3.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];

  document.querySelector("#selected-account").textContent = selectedAccount;

  // Get a handl
  const template = document.querySelector("#template-balance");
  const accountContainer = document.querySelector("#accounts");

  // Purge UI elements any previously loaded accounts
  accountContainer.innerHTML = '';

  // Go through all accounts and get their ETH balance
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    // ethBalance is a BigNumber instance
    // https://github.com/indutny/bn.js/
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
    // Fill in the templated row and put in the document
    const clone = template.content.cloneNode(true);
    clone.querySelector(".address").textContent = address;
    clone.querySelector(".balance").textContent = humanFriendlyBalance;
    accountContainer.appendChild(clone);
  });

  // Because rendering account does its own RPC commucation
  // with Ethereum node, we do not want to display any results
  // until data for all accounts is loaded
  await Promise.all(rowResolvers);

  // Display fully loaded UI for wallet data
  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";
}



/**
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {

  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#prepare").style.display = "block";

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  await fetchAccountData(provider);
  document.querySelector("#btn-connect").removeAttribute("disabled")
}


/**
 * Connect wallet button pressed.
 */
async function onConnect() {

  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();

}

/**
 * Disconnect wallet button pressed.
 */
async function onDisconnect() {

  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if (provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;

  // Set the UI back to the initial state
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}


/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document.querySelector("#btn-disconnect").addEventListener("click", onDisconnect);


});


// ...

/**
 * Gọi hàm "getShipment" từ smart contract
 */
async function getShipment(trackingNumber) {
  try {
    // Kiểm tra xem provider đã khởi tạo chưa
    if (!provider) {
      console.error("No wallet provider found. Connect a wallet first.");
      return false;
    }

    // Địa chỉ và ABI của smart contract
    const contractAddress = '0x18A5DFe159331c4C2C87bcA3db8613eD93805D58';  // Thay đổi địa chỉ của smart contract của bạn

    ;  // Thay đổi ABI của smart contract của bạn

    // Kiểm tra xem contractAbi đã định nghĩa chưa
    if (!contractAbi || !contractAbi.length) {
      console.error("Contract ABI is not defined.");
      return false;
    }

    console.log("web3: ", await web3.eth)
    // Tạo đối tượng smart contract
    const contract = new web3.eth.Contract(contractAbi, contractAddress);
    // console.log(await contract)
    // Gọi hàm "getShipment" của smart contract
    const result = await contract.methods.getShipment(trackingNumber).call();
    // console.log('Shipment details:', result);
    return result;

    // Hiển thị thông tin lô hàng trong UI hoặc thực hiện các thao tác khác với kết quả
    // document.querySelector("#shipment-details").textContent = `Tracking Number: ${result[0]}\nSender: ${result[1]}\nReceiver: ${result[2]}\nStatus: ${result[3]}\nLocation: ${result[4]}`;
  } catch (error) {
    console.error('Error calling getShipment:', error);
    return false
  }
}

/**
 * Gọi hàm "createShipment" từ smart contract
 */
async function createShipment(trackingNumber, receiver, status, location) {
  try {
    // Kiểm tra xem provider đã khởi tạo chưa
    if (!provider) {
      console.error("No wallet provider found. Connect a wallet first.");
      return;
    }

    // Địa chỉ và ABI của smart contract
    const contractAddress = '0x18A5DFe159331c4C2C87bcA3db8613eD93805D58';  // Thay đổi địa chỉ của smart contract của bạn

    // Kiểm tra xem contractAbi đã định nghĩa chưa
    if (!contractAbi || !contractAbi.length) {
      console.error("Contract ABI is not defined.");
      return false;
    }

    // Tạo đối tượng smart contract
    const contract = new web3.eth.Contract(contractAbi, contractAddress);
    // Kết nối với tài khoản hiện tại
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];
    console.log(sender)
    console.log(trackingNumber)
    console.log(receiver)
    console.log(status)
    console.log(location)

    // Gọi hàm "createShipment" của smart contract
    let res = await contract.methods.createShipment(trackingNumber, receiver, status, location).send({ from: sender });
    return res
  } catch (error) {
    console.error('Error calling createShipment:', error);
    return false
  }
}

/**
 * Gọi hàm "updateShipment" từ smart contract
 */
async function updateShipment(trackingNumber, status, location) {
  try {
    // Kiểm tra xem provider đã khởi tạo chưa
    if (!provider) {
      console.error("No wallet provider found. Connect a wallet first.");
      return;
    }

    // Địa chỉ và ABI của smart contract
    const contractAddress = '0x18A5DFe159331c4C2C87bcA3db8613eD93805D58';  // Thay đổi địa chỉ của smart contract của bạn

    // Kiểm tra xem contractAbi đã định nghĩa chưa
    if (!contractAbi || !contractAbi.length) {
      console.error("Contract ABI is not defined.");
      return false;
    }

    // Tạo đối tượng smart contract
    const contract = new web3.eth.Contract(contractAbi, contractAddress);

    // Kết nối với tài khoản hiện tại
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    // Gọi hàm "updateShipment" của smart contract
    let res = await contract.methods.updateShipment(trackingNumber, status, location).send({ from: sender });
    return res
  } catch (error) {
    console.error('Error calling updateShipment:', error);
    false;
  }
}

document.getElementById("updateBtn").addEventListener("click", async function () {
  try {
    // Lấy giá trị từ các ô nhập liệu
    const trackingNumber = parseInt(document.getElementById("tracking_number_update").value);
    const status = document.getElementById("status_update").value;
    const location = document.getElementById("location_update").value;

    // Gọi hàm "updateShipment" của smart contract
    let res = await updateShipment(trackingNumber, status, location);
    console.log('Shipment update successfully: ', res);

    // Hiển thị thông báo thành công
    if (res) {
      showSuccessMessage(true);
    } else showSuccessMessage(false);
  } catch (error) {
    console.error('Error calling updateShipment:', error);
    showSuccessMessage(false);
  }
});


document.getElementById("createBtn").addEventListener("click", async function () {
  try {
    // Lấy giá trị từ các ô nhập liệu
    const trackingNumber = parseInt(document.getElementById("tracking_number").value);
    const receiver = document.getElementById("receiver").value;
    const status = document.getElementById("status").value;
    const location = document.getElementById("location").value;

    // Gọi hàm "createShipment" của smart contract
    let res = await createShipment(trackingNumber, receiver, status, location);
    console.log('Shipment created successfully: ', res);

    // Hiển thị thông báo thành công
    if (res) {
      showSuccessMessage(true);
    } else showSuccessMessage(false);
  } catch (error) {
    console.error('Error calling createShipment:', error);
    showSuccessMessage(false);
  }
});

// Hàm để hiển thị thông báo
function showSuccessMessage(bool) {
  if (bool) {
    const successMessage = document.getElementById("success-message");
    successMessage.style.display = "block";
    setTimeout(() => {
      successMessage.style.display = "None";
    }, 10000)
  } else {
    const failMesssage = document.getElementById("fail-message");
    failMesssage.style.display = "block";
    setTimeout(() => {
      failMesssage.style.display = "None";
    }, 10000)
  }
}

// UI form
document.querySelector("#getModal #getBnt").addEventListener("click", async function (event) {

  event.preventDefault();

  // Lấy giá trị từ ô nhập tracking number
  const trackingNumberInput = document.querySelector("#tracking-number");
  const trackingNumber = trackingNumberInput.value;

  // Disable input sau khi nhấn nút "Get"
  // trackingNumberInput.setAttribute("disabled", true);

  // Gọi hàm getShipment với số theo dõi đã nhập
  let res = await getShipment(trackingNumber);

  // Hiển thị kết quả trên giao diện
  displayResult(res);

  // Đóng modal sau khi gọi xong hàm
  // $('#getModal').modal('hide');

  // Enable input sau khi hoàn thành
  // trackingNumberInput.removeAttribute("disabled");
});

function displayResult(result) {
  if (result) {
    // Lấy phần tử container để hiển thị kết quả
    const resultContainer = document.getElementById("result-container");

    // Tạo một đối tượng HTML để hiển thị thông tin
    const resultElement = document.createElement("div");
    resultElement.classList.add("alert", "alert-success");
    resultElement.innerHTML = `
    <strong>Tracking Number:</strong> ${result[0]}<br>
    <strong>Sender:</strong> ${result[1]}<br>
    <strong>Receiver:</strong> ${result[2]}<br>
    <strong>Status:</strong> ${result[3]}<br>
    <strong>Location:</strong> ${result[4]}<br>
  `;

    // Xóa nội dung cũ và thêm thông tin mới
    resultContainer.innerHTML = "";
    resultContainer.appendChild(resultElement);
  } else {
    // Lấy phần tử container để hiển thị kết quả
    const resultContainer = document.getElementById("result-container");

    // Tạo một đối tượng HTML để hiển thị thông tin
    const resultElement = document.createElement("div");
    resultElement.classList.add("alert", "alert-success");
    resultElement.innerHTML = `
        <strong>Tracking Number:</strong> ${"Không có kết quả"}<br>
        <strong>Sender:</strong> ${"Không có kết quả"}<br>
        <strong>Receiver:</strong> ${"Không có kết quả"}<br>
        <strong>Status:</strong> ${"Không có kết quả"}<br>
        <strong>Location:</strong> ${"Không có kết quả"}<br>
      `;

    // Xóa nội dung cũ và thêm thông tin mới
    resultContainer.innerHTML = "";
    resultContainer.appendChild(resultElement);
  }
}

