import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import hospitalAppAbi from "../contract/hospitalApp.abi.json"
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const hospitalAppContract = "0x60d5a771314b8E96153530e0033aB34c46169C34"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"


let kit
let contract
let patients = []
let projects =[]




//connect to celo blockchain network
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
            const accounts = await kit.web3.eth.getAccounts() 
            kit.defaultAccount = accounts[0] 
            // Declare the smart contract as a variable to use its functions
            contract = new kit.web3.eth.Contract(hospitalAppAbi, hospitalAppContract) 
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


//when the window loads for the first time
window.addEventListener("load", async() => 
{
    // Runs all these functions once the page is loaded
    patientOff()
    crowdOff()
    notification("⌛ Loading, please wait... ⌛")
    await connectWallet()
    await getBalance()
    notificationOff()
});



//approve function
async function approve(_price){
    // Show an approve request for cUSD token at a defined quantity
    const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress) // Declare cUSD contract as variable
    const result = await cUSDContract.methods.approve(hospitalAppContract, _price).send({ from: kit.defaultAccount }) // Send approve request to wallet
    return result
}


//get the balance of the account
const getBalance = async function(){
  
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount) // Get balance from wallet
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2) // Get cUSD balance from wallet
    document.querySelector("#balance").textContent = cUSDBalance
}



















//*****************deal with patient functionality first


//when a new patient is to be created

document
  .querySelector("#newPatientBtn")
  .addEventListener("click", async (e) => {
    notification("i am working")
    const params = [
      document.getElementById("newPatientName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newPatientHospital").value,
      document.getElementById("newPatientDescription").value,
      new BigNumber(document.getElementById("newAmount").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"......`)
       try {
      const result = await contract.methods
        .writePatient(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully registered "${params[0]}" as a patient.`)
    getPatients()
  })



  //get all the patients and display them.
  const getPatients = async function() {
  const _patientsLength = await contract.methods.getPatientLength().call()
  const _patients = []

   for (let i = 0; i < _patientsLength; i++) {
    let _patient = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readPatient(i).call()
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        image: p[2],
        hospital: p[3],
        description: p[4],
        price: new BigNumber(p[5]),
        cleared: p[6],
      })
    })
    _patients.push(_patient)
  }
  patients = await Promise.all(_patients)
  renderPatients()
}



//display patients
function renderPatients() {
  document.getElementById("fundraise").innerHTML = ""
  patients.forEach((_patient) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = patientTemplate(_patient)
    document.getElementById("fundraise").appendChild(newDiv)
  })
}


function productTemplate(_patient) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_patient.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${_patient.cleared} Sold
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_patient.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_patient.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_patient.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_patient.hospital}</span>
        </p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark clearP fs-6 p-3" id=${
            _patient.index
          }>
            Clear ${_patient.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)}  cUSD.
          </a>
        </div>
      </div>
    </div>
  `
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}



//pay for the patient.
document.querySelector("#fundraise").addEventListener("click", async (e) => {
  if (e.target.className.includes("clearP")) {
    const index = e.target.id
    notification("⌛ Waiting for payment approval...")
    try {
      await approve(patients[index].price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
        notification(`⌛ Awaiting clearance for "${patients[index].name}"...`)
    try {
      const result = await contract.methods
        .clearPatient(index)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully cleared "${patients[index].name}"'s expenses.`)
      getpatients()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})

















//**********fundraising logic.



//creating a new fundraising project

document
  .querySelector("#newProjectBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newProjectTitle").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newProjectDescription").value,
      new BigNumber(document.getElementById("newAmount").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Creating new project "${params[0]}"......`)
       try {
      const result = await contract.methods
        .newFundraise(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully created "${params[0]}".`)
    getProjects()
  })



    //get all the patients and display them.
  const getProjects = async function() {
  const _projectsLength = await contract.methods.numbeOfProjects().call()
  const _projects = []

   for (let i = 0; i < _projectsLength; i++) {
    let _project = new Promise(async (resolve, reject) => {
      let p = await contract.methods.getProjectDetails(i).call()
      resolve({
        index: i,
        owner: p[0],
        title: p[1],
        image: p[2],
        description: p[3],
        goal: new BigNumber(p[4]),
        funded: new BigNumber(p[5]),
        pStatus: p[6],
      })
    })
    _projects.push(_project)
  }
  projects = await Promise.all(_projects)
  renderProjects()
}


//render project details

//display patients
function renderProjects() {
  document.getElementById("fundraise").innerHTML = ""
  patients.forEach((_project) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = projectTemplate(_patient)
    document.getElementById("fundraise").appendChild(newDiv)
  })
}


function projectTemplate(_project) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_project.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${_project.funded} out of ${_project.goal} cUSD
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_project.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_project.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_project.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_project.hospital}</span>
        </p>
        <form>
           <div class="col">
              <input type="text", id="quantity${_project.index}" class="form-control mb-2" placeholder="Amount to donate...">
           </div>
            </form>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark donateBtn fs-6 p-3" id=${
            _project.index
          }>
            Donate
          </a>
        </div>
      </div>
    </div>
  `
}

// function identiconTemplate(_address) {
//   const icon = blockies
//     .create({
//       seed: _address,
//       size: 8,
//       scale: 16,
//     })
//     .toDataURL()

//   return `
//   <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
//     <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
//         target="_blank">
//         <img src="${icon}" width="48" alt="${_address}">
//     </a>
//   </div>
//   `
// }




//donate to hospital charity.


document
    .querySelector("#fundraise")
    .addEventListener("click", async(e) => {
 
        // ----------WHEN "DONATE" BUTTON IS CLICKED----------
        if(e.target.className.includes("donateBtn"))
        {
            const index = e.target.id // Take the request index from the id of the button
            const quantity = new BigNumber(document.getElementById(`quantity${index}`).value)

            notification("⌛ Waiting for payment approval... ⌛")

            try{
              await approve(quantity.shiftedBy(ERC20_DECIMALS))

            }catch(error){
              notification(`⚠️ ${error}. ⚠️`)
                throw "ErrorInNotification"
            }
            notification(`⌛ Awaiting for payment of ${quantity} cUSD ⌛`)

            try{

                const result = await contract.methods.donate(index, quantity.shiftedBy(ERC20_DECIMALS)).send({from: kit.defaultAccount})
                // If successful, reload balance and requests, and show a notification
                notification(`🎉 Sucess! Thanks for donating! 🎉`)
                getProjects()
                getBalance()


            }catch(error)
            {
                notification(`⚠️ ${error}. ⚠️`)
                throw "ErrorInNotification"
            }



}

})

    //when the view projects button is clicked
    document
  .querySelector("#loadProjects")
  .addEventListener("click", async (e) => {
    getProjects()

  })

   //wanting to join the whitelist
    document
  .querySelector("#whitelistBtn")
  .addEventListener("click", async (e) => {
    try{
    const _joinWhitelist = await contract.methods.numbeOfProjects().call()
  }catch(error){

        notification(`⚠️ ${error}. ⚠️`)

  }

  })





//******************************working with the buttons.


//functions to toggle sub-buttons

function patientOn(){
  document.querySelector(".newPatient").style.display = "block"

}

function patientOff(){
  document.querySelector(".newPatient").style.display = "none"

}


function crowdOn(){
  document.querySelector(".newCrowd").style.display = "block"

}

function crowdOff(){
  document.querySelector(".newCrowd").style.display = "none"

}


//display the patient sub-buttons
document
  .querySelector("#patientButton")
  .addEventListener("click", () => {
    crowdOff()
    patientOn()


  })
//display the crowd sub-buttons
  document
  .querySelector("#crowdButton")
  .addEventListener("click", () => {
    patientOff()
    crowdOn()

  })



  //display the patients
  document
  .querySelector("#loadPatients")
  .addEventListener("click", () => {
    patientOff()
    renderPatients()

  })


 //notification functions
function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}
















