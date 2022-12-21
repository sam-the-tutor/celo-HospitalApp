// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/// @title HospitalApp Contract
/// @author Sam-the-tutor


//the IERC20Token contract
interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}


/// Start of the contract

contract HospitalApp{

	//total number of patients created
    uint internal patientsCreated= 0;

    uint internal  patientsCleared=0;

    //number of fundraising projects so far done.
	uint internal projectLength = 0;



    //address for the token contract
    address internal cUsdTokenAddress= 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


	//***********************************************************************#
	    //*********************DONATING TO SPECIFIC PATIENT***********************#
	    //***********************************************************************#


	    /// track addresses if whitelisted or not
	     mapping(address => bool) public whitelistedAddresses;

	    /// an array to hold whitelisted addresses
	     address[] whitelistedAddress;


	    //when an address is whitelisted.
         event addressWhitelisted(address indexed whitelistaddress);



         //adding an address to the whitelist array
	    function whitelistAddress() IsWhitelisted public {
	        
	        whitelistedAddresses[msg.sender] = true;
	        whitelistedAddress.push(msg.sender);
	        emit addressWhitelisted(msg.sender);
	    }


	    //function to check whether an account is whitelisted
	    modifier IsWhitelisted(){
	        require(!whitelistedAddresses[msg.sender], "Your Address is already whitelisted");
            _;

	    }

        //check whether an account is in the whitelist
        modifier InWhitelist(){
                require(whitelistedAddresses[msg.sender] == true, "not whitelisted");
                _;


    }
    
	    //patient struct storing the details about a specific patient.
	    struct Patient{
	        address payable owner;
	        string name;
	        string image;
	        string hospital;
	        string description;
	        uint price;
	        uint cleared;
	    }

	    //mapping the uints to the patient struct
   		 mapping(uint =>Patient) private patients;


	     //hospitals can list their patients with their needs 
	    function writePatient(
	        string memory _name,
	        string memory _image,
	        string memory _hospital,
	        string memory _description,
	        uint _price

	    		) InWhitelist public {

	        uint _cleared =0;

	        patients[patientsCreated] = Patient(
	            payable(msg.sender),
	            _name,
	            _image,
	            _hospital,
	            _description,
	            _price,
	            _cleared
	            );

	        patientsCreated++;

	    }

	    //get the total number of specific patients created.
		function getPatientLength() public view returns(uint) {
		        return (patientsCreated);
		    }

		     //get patients that have been cleared
	    function getPatientCleared() public view returns(uint) {
	        return (patientsCleared);
	    }


	    //get the details of the patient with a specific index
	    function readPatient(uint _index) public view returns (Patient memory){
	        return patients[_index];
	    }


		//pay for the patients needs and clear them from the list.
	    function clearPatient(uint _index) public payable {

	        Patient storage currentPatient = patients[_index];
	        require(
	            IERC20Token(cUsdTokenAddress).transferFrom(
	                msg.sender,
	                currentPatient.owner,
	                currentPatient.price
	                ),
	                "Transfer failed."
	            );
	        currentPatient.cleared=1;
	        patientsCleared++;

	    }




	    //*******************************crowdfunding


	    // Fundraise struct
    struct Fundraise
    {
        address payable owner;
        string title;
        string description;
        string image;
        uint goal;
        uint funded;
        uint pStatus;
    }

    //mapping for the fundraise struct
    mapping(uint => Fundraise) internal fundraise;


    
    /*modifier function to check whether owner of the project is 
    the same as one interacting with it currently
    */
    modifier ownerOnly(uint _id)
    {
        require(msg.sender == fundraise[_id].owner, "Sorry,you dont own this fundraising project");
        _;
    }


    //event for the creation of a new project
    event projectCreated(address indexed projectOwner, string indexed projectTitle);



    // modifier function to delete/hide an already created fundraise project
     function removeProject(uint _id) public ownerOnly(_id){

        fundraise[_id].pStatus= 1;
    }


    // get the total number of fundraising projects so far.
     function numbeOfProjects() public view returns(uint){
        
        return projectLength;
    }


    //function to create a new fundraising project

    function newFundraise(string memory _title, 
        string memory _description, 
        string memory _image, 
        uint _goal) 
                  public{

                    currentStatus = Statuses.Active;
                    fundraise[projectLength] = Fundraise(payable(msg.sender), _title, _description, _image, _goal, 0, 0);
                    emit projectCreated(msg.sender,_title);
                    projectLength++;
    }


    //function to get all the fundraising projects

    function getProjectDetails(uint _id) public view returns(address payable, string memory, string memory, string memory, uint, uint, uint) {
    
        return (
            fundraise[_id].owner, 
            fundraise[_id].title, 
            fundraise[_id].description, 
            fundraise[_id].image, 
            fundraise[_id].goal, 
            fundraise[_id].funded, 
            fundraise[_id].pStatus
        
        );
    }


    //function to contribute to a fundraising project. 

    function contribute(uint _id, uint _amount) public payable{
        // This requirement ensures the sender has sent the amount specified to the owner of the request, if the transaction fails, the next line won't run
        //remeber to change cUsd to the real variable.

        require(IERC20Token(cUsdTokenAddress)
            .transferFrom(msg.sender, fundraise[_id].owner, _amount), "Transaction failed, please try again.");

        // This part will only run if the transaction is successful, it keeps track of the total donated amount

        fundraise[_id].funded += _amount;

        // If the goal is complete change the active status to zero, hiding the request
        
        if (fundraise[_id].funded >= fundraise[_id].goal)
        {
            
            fundraise[_id].pStatus = 1;
        }
    }












}