
import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import marketplaceAbi from "../contract/marketplace.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const MPContractAddress = "0x9cAf12b1BA7C706c1f86b5a5c2E2393ddBD02A77"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit
let contract

const connectWallet = async function()
{
    if(window.celo)
    {
        // Asks to connect wallet the first time visiting
        notification("⚠️ Please connect this DApp with your wallet. ⚠️")
        try
        {
            // Wallet setup (connect accounts)
            await window.celo.enable()
            notificationOff()
            const web3 = new Web3(window.celo)
            kit = newKitFromWeb3(web3)
            const accounts = await kit.web3.eth.getAccounts() // Get all wallet accounts
            kit.defaultAccount = accounts[0] // Use the selected wallet account as the defaultAccount
            contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress) // Declare the smart contract as a variable to use its functions
        }
        catch(error)
        {
            notification(`⚠️ ${error}. ⚠️`)
        }
    }
    else
    {
        notification("⚠️ In order to continue, you should install the 'CeloExtensionWallet' wallet and connect to this DApp. ⚠️")
    }
}





//approve 
async function approve(_price)
{
    // Show an approve request for cUSD token at a defined quantity
    const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress) // Declare cUSD contract as variable
    const result = await cUSDContract.methods.approve(MPContractAddress, _price).send({ from: kit.defaultAccount }) // Send approve request to wallet
    return result
}

//get the balance and display it.
const getBalance = async function()
{
    // Display user balance
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount) // Get balance from wallet
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2) // Get cUSD balance from wallet
    document.querySelector("#balance").textContent = cUSDBalance
}

//load all the current projects in the browser

const processRequests = async function()
{
    const _maxIndex = await contract.methods.latestRequest().call() // Get the total number of requests
    let requests = []
    for(let i = 0; i < _maxIndex; i++){
        let r = await contract.methods.requestData(i).call() // Call the requestData function for every request
        if(r[6] == 1)
        {
            // Push a request to the list ONLY if it's marked as active
            requests.push({index: i, owner: r[0], title: r[1], description: r[2], image: r[3], goal: r[4], funded: r[5]})
        }
    }
    renderRequests(requests)
}

//display the projects in the browser
function renderRequests(requests)
{
    document.getElementById("crowdfund").innerHTML = "" // Clear the main area
    requests.forEach((_request) => 
    {
        // Add one card (requestTemplate) for every request in the array and append it to main area
        const newDiv =  document.createElement("div")
        newDiv.className = "col-md-5" // For card design
        newDiv.innerHTML = requestTemplate(_request)
        document.getElementById("crowdfund").appendChild(newDiv)
    })
}

function requestTemplate(_request)
{
    // Just a template for the html of every card
    return `
	  <div class="card mb-4 border" style="background-color: #AAAAAA;">
        <img class="card-img-top" src="${_request.image}" alt="'${_request.title}', by ${_request.owner}">
        <div class="position-absolute top-0 end-0 px-2 py-1">
            <a type="button" class="btn-close border deleteBtn" id="del${_request.index}" data-index="${_request.index}" style="background-color: #222222;"></a>
        </div>
        <div class="card-body text-left p-4 position-relative">
            <div class="translate-middle-y position-absolute top-0">
                ${identiconTemplate(_request.owner)}<div class="card-text mb-4">${_request.owner}</div>
            </div>
            <h1 class="card-title fs-3 fw-bold mt-2">${_request.title}</h1>
            <p class="fw-bold border card-text mt-3 mb-2" style="min-height: 80px">${_request.description}</p>
            <h5 class="fw-bold card-title mb-2">${_request.funded} of ${_request.goal} cUSD</h5>
            <form>
                <div class="col">
                    <input type="text", id="quantity${_request.index}" class="form-control mb-2" placeholder="Amount...">
                </div>
            </form>
            <div class="d-grid gap-1">
                <a class="fw-bold btn btn-lg btn-outline-dark border donateBtn fs-6 p-3" id=${_request.index} style="background-color: #222222; color: #FFFFFF">Donate NOW!</a>
            </div>
        </div>
    </div>
	`
}

function identiconTemplate(_address)
{
    // This creates a visual identifier icon for each public key
    const icon = blockies.create({seed: _address, size: 8, scale: 16}).toDataURL()
    return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
        <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions" target="_blank">
            <img src="${icon}" width="48" alt="${_address}">
        </a>
    </div>`
}


//turn on notifications
function notification(_text)
{
    // Shows a notification at the top of the page
    document.querySelector(".alert").style.display = "block"
    document.querySelector("#notification").textContent = _text
}

//turn off notifications
function notificationOff()
{
    // Remove any active notification
    document.querySelector(".alert").style.display = "none"
}



//listen for the window to load and execute some functions
window.addEventListener("load", async() => 
{
    // Runs all these functions once the page is loaded
    notification("⌛ Loading, please wait... ⌛")
    await connectWallet()
    await getBalance()
    await processRequests()
});







//******************************************************* When NEW REQUEST button is clicked:
document
    .querySelector("#newRequestBtn")
    .addEventListener("click", async(e) => {
        // ----------CHECK FOR VALID INPUTS----------
        if(document.getElementById("newGoal").value % 1 !== 0 || document.getElementById("newGoal").value <= 0)
        {
            // Rule: "Goal" input must be a positive integer
            notification("⚠️ Must input a positive integer, greater than zero. ⚠️")
            throw "InvalidNumber"
        }
        if(document.getElementById("newRequestTitle").value === "" || document.getElementById("newRequestDescription").value === "" || document.getElementById("newImgUrl").value === "")
        {
            // Rule: Inputs can't be blank
            notification("⚠️ Empty parameters are not allowed! ⚠️")
            throw "InvalidInput"
        }
        // ----------END----------
        // Creates an array with every input if it's valid
        const params = [
            document.getElementById("newRequestTitle").value,
            document.getElementById("newRequestDescription").value,
            document.getElementById("newImgUrl").value,
            new BigNumber(document.getElementById("newGoal").value).toString()
        ]
        notification(`⌛ Adding Request '${params[0]}'... ⌛`)
        try
        {
            // Try to add the request using the previously created array as the parameters
            const result = await contract.methods.newRequest(...params).send({ from: kit.defaultAccount })
        }
        catch(error)
        {
            notification(`⚠️ ${error} ⚠️`)
            throw "ErrorInNotification"
        }
        // If done correctly, reload the requests section and show a notification
	    notification(`🎉 Successfully Added! Good luck! 🎉`)
        processRequests()
    })




         <form>
                <div class="col">
                    <input type="text", id="quantity${_request.index}" class="form-control mb-2" placeholder="Amount...">
                </div>
            </form>





function checkDonation(){
    require(quantity > 0,"You cant donate nothing");
    require(quantity % 1==0,"Please,donate full dollars.");
}













    //***************************************************when the donate button is clicked.
document
    .querySelector("#crowdfund")
    .addEventListener("click", async(e) => {
 
        // ----------WHEN "DONATE" BUTTON IS CLICKED----------
        if(e.target.className.includes("donateBtn"))
        {
            const index = e.target.id // Take the request index from the id of the button
            const quantity = new BigNumber(document.getElementById(`quantity${index}`).value)


            // ----------CHECK FOR VALID INPUT----------
            if(quantity <= 0)
            {
                // Rule: Donated amount must be greater than zero
                notification("⚠️ Please do not donate zero or a negative amount, thanks ⚠️")
                throw "InvalidNumber"
            }
            
            if(quantity % 1 !== 0)
            {
                // Rule: Donated amount must be integer, solidify doesn't support floating point
                notification("⚠️ Only integer numbers are supported ⚠️")
                throw "InvalidNumber"
            }




            // *****************************************END OF CHECK----------


            notification("⌛ Waiting for payment approval... ⌛")
            try
            {
                // Use the previous "approve" function to ask for spending permission for the quantity to be donated
                await approve(quantity.shiftedBy(ERC20_DECIMALS))
            }
            catch(error)
            {
                notification(`⚠️ ${error}. ⚠️`)
                throw "ErrorInNotification"
            }
            notification(`⌛ Awaiting for payment of ${quantity} cUSD ⌛`)
            try
            {
                // Show payment prompt using the "donate" function of the contract, and wait for response
                const result = await contract.methods.donate(index, quantity.shiftedBy(ERC20_DECIMALS)).send({from: kit.defaultAccount})
                // If successful, reload balance and requests, and show a notification
                notification(`🎉 Sucess! Thanks for donating! 🎉`)
                processRequests()
                getBalance()
            }
            catch(error)
            {
                notification(`⚠️ ${error}. ⚠️`)
                throw "ErrorInNotification"
            }
        }
        // ----------END----------
        // ----------WHEN "DELETE" BUTTON IS CLICKED----------
        else if(e.target.className.includes("deleteBtn"))
        {
            let index = e.target.getAttribute("data-index") // Get the request index, which is stores in the "data-index" attribute of the button
            notification(`⌛ Waiting for confirmation ⚠️ Be aware you're about to DELETE the request! Only the owner address can do this. ⚠️`)
            try
            {
                // Call the delete function, note it will only work as intended if the caller is the owner of the request
                const result = await contract.methods.deleteRequest(index).send({from: kit.defaultAccount})
                // If successful, show notification and reload requests
                notification(`🎉 Success! Request deleted. 🎉`)
                processRequests()
            }
            catch(error)
            {
                notification(`⚠️ ${error}. ⚠️`)
                throw "ErrorInNotification"
            }
        }
        // ----------END----------
    })






















































































