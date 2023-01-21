
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import marketplaceAbi from '../contract/hospitalApp.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18

const MPContractAddress = "0x9F6654619Fac3Ca99898990a31C3A4bc9B3795C0"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit
let contract
let accounts
let donations
let patients = []
let projects = []


const connectCeloWallet = async function () {
  if (window.celo) {
    try {
      notification("⚠️ Please approve this DApp to use it.")
      await window.celo.enable()
      notificationOff()
      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
      
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}


//approve the address to spend the specified amount
async function approve(_price) {
        const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

        const result = await cUSDContract.methods
          .approve(MPContractAddress, _price)
          .send({ from: kit.defaultAccount })
        return result
      }


//add an address to the whitelist
document.querySelector("#whitelistButton").addEventListener("click", async (e) => {
      try{

        const result = await contract.methods
            .whitelistAddress()
            .send({ from: kit.defaultAccount })
            notification("Your address has been whitelisted successfully.")


      }catch(error){
      notification("Your Address is already whitelisted.")
  }
})


//paying for the patients needs
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id

    notification("⌛ Waiting for payment approval...")
    const price = new BigNumber(patients[index].price)
                    .shiftedBy(ERC20_DECIMALS)
                    .toString()

                    
    try {
      await approve(price)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
       notification(`⌛ Awaiting payment for "${patients[index].name}"...`)
    try {
      const result = await contract.methods
        .payPatientBills(index)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully paid for "${patients[index].name}".`)
      getPatients()
      getBalance()
    } catch (error) {
      notification("Sorry, you cant pay for your own patient..")
      console.log("Please refresh the browser, the above error will go off")
    }
  }
})


//load patients from the smart contract
const getPatients = async function() {
  patients=[]
  const _patientsLength = await contract.methods.getpatientsLength().call()
  console.log(_patientsLength)
  for (let i = 0; i < _patientsLength; i++) {

    let r = await contract.methods.readPatient(i).call() 
        
            // Push a request to the list ONLY if it's marked as active
            patients.push({index: i, owner: r[0], name: r[1], image: r[2], description: r[3], hospital: r[4], price: r[5]})
        
  
    }
    renderPatients()
    console.log("patients:",patients)
}



//registering a new patient from the modal
document
  .querySelector("#newPatientBtn")
  .addEventListener("click", async (e) => {
    patientOff()
    
    const params = [
      document.getElementById("newPatientName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newPatientDescription").value,
      document.getElementById("newLocation").value,
      document.getElementById("newPrice").value,

    ]

    notification(`⌛ Adding "${params[0]}"...`)

     try {
      const result = await contract.methods
        .writePatient(...params)
        .send({ from: kit.defaultAccount })

        notification(`🎉 You successfully added "${params[0]}".`)
        patients=[]
        getPatients()
    } catch (error) {
      notification(`⚠️ ${error}`)
    }

    
  })


//patient to display template
  function productTemplate(patient) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${patient.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start"> 
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(patient.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${patient.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${patient.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${patient.hospital}</span>
        </p>
        <div class="d-grid gap-2">
          <button class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${
            patient.index
          }>
            Pay ${patient.price} cUSD
          </button>
        </div>
      </div>
    </div>
  `
}


//when the window loads for the first time
window.addEventListener('load', async () => {
  notification("⌛ Loading...")
  homepage()
  await connectCeloWallet()
  await getBalance()
  notificationOff()
});


//display the homepage image
function homepage(){
  document.getElementById("marketplace").innerHTML = ""
  const newImg = document.createElement("img")
  newImg.src = "https://i.ibb.co/RCpxYgC/hd.webp"
  document.getElementById("marketplace").appendChild(newImg)

}


//get balance form the smart contract
const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

//render the patients
function renderPatients() {
  document.getElementById("marketplace").innerHTML = ""
  patients.forEach((patient) => {
    if(patient.owner != "0x0000000000000000000000000000000000000000"){
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = productTemplate(patient)
    document.getElementById("marketplace").appendChild(newDiv)
  }

  })
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
  </div>`
}


//registering a new project from the modal
document
  .querySelector("#newProjectBtn")
  .addEventListener("click", async (e) => {
    crowdOff()
    
      const params = [
      document.getElementById("ProjectName").value,
      document.getElementById("ProjectImg").value,
      document.getElementById("ProjectDescription").value,
      new BigNumber(document.getElementById("ProjectGoal").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString()
    ]
    notification(`⌛ Adding "${params[0]}"...`)
     try {
      const result = await contract.methods
        .newFundraise(...params)
        .send({ from: kit.defaultAccount })

        notification(`🎉 You successfully added "${params[0]}".`)
        projects =[]
        getProjects()
    } catch (error) {
      notification(`⚠️ Project not registered, try again later.`)
    }
    
  })


//fetch and display new projects
  const getProjects = async function() {
    projects =[]
  const _projectsLength = await contract.methods.numbeOfProjects().call() 
  for (let i = 0; i < _projectsLength; i++) {


    let t = await contract.methods.getAllProjects(i).call() // Call the requestData function for every request
        if(t[6] == false){
            // Push a request to the list ONLY if it's marked as active
            projects.push({index: i, owner: t[0], title: t[1], image: t[2], description: t[3], goal: t[4], funded: t[5]})
        }
  renderProjects()
}
}

//render projects
function renderProjects() {
  document.getElementById("marketplace").innerHTML = ""
  projects.forEach((_project) => {
    if(_project.owner != "0x0000000000000000000000000000000000000000"){
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = projectTemplate2(_project)
    document.getElementById("marketplace").appendChild(newDiv)
  }
  })
}

   

//project template for display
function projectTemplate2(_project) {
  return `
<div class="card mb-4 border">
          <h3 class="card-title fs-3 fw-bold mt-2">${_project.title}</h3>
        
        <div class="position-absolute top-0 end-0 px-2 py-1">
        </div>
        <div class="card-body text-left p-4 position-relative">
              <img class="card-img-top" src="${_project.image}" alt="'${_project.title}', by ${_project.owner}">
            
            <p class="fw-bold border card-text mt-3 mb-2"  data-toggle="tooltip" title=${_project.description}>About the project.......</p>
            <h5 class="fw-bold card-title mb-2">${_project.funded/1000000000000000000} of ${_project.goal/1000000000000000000} cUSD</h5>
            <form>
                <div class="col">
                    <input type="text", id="quantity${_project.index}" class="form-control mb-2" placeholder="Amount...">
                </div>
            </form>
            <div class="d-grid gap-1">
                <a class="fw-bold btn btn-primary btn-outline-dark border donateBtn fs-6 p-3" id=${_project.index}  color: #FFFFFF">Contribute</a>
            </div>
        </div>
    </div>
  `
}





    //contributing to a project
document
    .querySelector("#marketplace")
    .addEventListener("click", async(e) => {
        if(e.target.className.includes("donateBtn"))
        {
            const index = e.target.id


            const quantity = new BigNumber(document.getElementById(`quantity${index}`).value)
            notification("⌛ Waiting for payment approval... ⌛")
            try{
                await approve(quantity.shiftedBy(ERC20_DECIMALS))
            }
            catch(error){
                notification(`⚠️ ${error}. ⚠️`)
                console.log("first error:",error)            }
            notification(`⌛ Awaiting for payment of ${quantity} cUSD ⌛`)
            try{ 
                const result = await contract.methods.contribute(index, quantity.shiftedBy(ERC20_DECIMALS))
                .send({from: kit.defaultAccount})
                notification(`🎉 Sucess! Thanks for donating! 🎉`)
                getDonations()
                getBalance()
            }
            catch(error) {
                notification("you cant contribute to your own project...")
                console.log("Please refresh the browser, the above error will go off")
            }
        }
    })


//donations
//getting specific donations from the contract
document
  .querySelector("#myDonations")
  .addEventListener("click", async (e) => {
    getDonations()
  })


//function to get donations
async function getDonations(){
donations = await  contract.getPastEvents('donation',{
    filter:{donationFrom:accounts[0]},
        fromBlock:0,
        toBlock: 'latest'
      },(err,events) =>{
            return events;
})
renderDonations()
}


//function to render donations
async function renderDonations(){
  document.getElementById("marketplace").innerHTML = ""
  donations.forEach((_donation) => {
    console.log("here is my donation:",_donation)
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = donationTemplate(_donation)
    document.getElementById("marketplace").appendChild(newDiv)
  })
}


//convert epoch date to local time.
function getDate(x) {
   const myDate = new Date(x * 1000);
   const fn = myDate.toLocaleString()
   return fn;
}


//rendering the donations..
function donationTemplate(_donation) {
  return `
    <div class="card mb-4 bg-secondary text-white">
        <h2 class="card-title fs-4 fw-bold mt-2">${_donation.event}</h2>
        <p class="card-text mb-4" style="min-height: 10px">
         Address: <a href="https://explorer.celo.org/alfajores/tx/${_donation.transactionHash}">View Transaction</a>            
        </p>
        <p class="card-text mb-4" style="min-height: 10px">
         Amount: ${(_donation.returnValues["amount"]/1000000000000000000)}  cUSD           
        </p>
        <p class="card-text mb-4" style="min-height: 10px">
         Date: ${getDate(_donation.returnValues["timeOfDonation"])}             
        </p>

      </div>
  `
}


//function to turn notifications on and off
function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
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
  .addEventListener("click", async () => {
    patientOff()
    await getPatients()
  })

 //display the projects
  document
  .querySelector("#loadProjects")
  .addEventListener("click", async () => {
    crowdOff()
    await getProjects()
  })


//functions to toggle buttons
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


