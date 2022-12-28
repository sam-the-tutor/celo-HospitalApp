




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
