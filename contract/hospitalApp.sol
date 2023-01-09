// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

/**
@author Samthetutor on dacade.org
@title Hospital smart contract
*/


/**
@dev The standard protocol of a token
*/
interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Marketplace {

    /**
    @dev Global variables being created along side the token address for celo (faucet Cusd)
    */
    uint internal patientsLength = 0;
    uint internal projectLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


    /// Boolen Mapped variable called whitelisteAddresses that will be used for checks/assertation
     mapping(address => bool) public whitelistedAddresses;

    /// Created a struct(customized variable to hold customized data) called Patient

     struct Patient {
        address payable owner;
        string name;
        string image;
        string description;
        string hospital;
        uint price;
        bool cleared;
    }

    /// mapping an unsigned integer to a struct variable(i.e connecting a number to a particular patient details).
     mapping (uint => Patient) internal patients;


    /// An array containing every address that has been whitelisted
     address[] whitelistedAddress;


    /**
    @dev addressWhitelisted and donation are events that will be emitted when dertain conditions are true.
    */
    event addressWhitelisted(address indexed whitelistaddress);
    event donation(address indexed donationFrom, string indexed _name, uint256 amount,uint256 timeOfDonation);


     /**
     @notice Afunction to add an address to the whitelist
     @dev assert that the address is not already in the whitelist to avoid duplication and increasing the whitelistedAddress array with redundant address. this donw using the require statement
     @dev An addressWhitelisted event is trigged upon sucessful addition to the addressWhitelisted array

     */
    function whitelistAddress() public {
        require(!whitelistedAddresses[msg.sender], "Your Address is already whitelisted");
        whitelistedAddresses[msg.sender] = true;

        whitelistedAddress.push(msg.sender);

        emit addressWhitelisted(msg.sender);
    }

    /// Modifier that contains require statemnt which will be reuseable over time as we go along
     modifier InWhitelist(){
                require(whitelistedAddresses[msg.sender], "not whitelisted");
                _;
    }

    
    /**
    @notice A function to add patient variable called writePatient
    @param _name A string to contain the name of the patient
    @param _image The variable to input the image of the patient
    @param _description The variable to keep a detail of the patient's condition
    @param _hospital The variable to keep the name of the hospital the patient is admitted in
    @param _price The variable to keep donatable amount to help the patient
    @dev using the value of patientsLength and linking it to the details of the patient and then increase the value of patientLength by 1
    */
    function writePatient(
        string calldata _name,
        string calldata _image,
        string calldata _description, 
        string calldata _hospital, 
        uint _price

    ) 
    public InWhitelist
    {
        bool _cleared = false;
        patients[patientsLength] = Patient(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _hospital,
            _price,
            _cleared
        );
        patientsLength++;
       
    }

    /**
    @notice A function to get patient data
    @dev Get patient details by using their unique number
    @param _index the index of the patient, it is kind of like patient number, this is unique and will only give the details of the patient assigned to this number
    @return _owner The address of the owner
    @return _name A string to contain the name of the patient
    @return _image The variable to input the image of the patient
    @return _description The variable to keep a detail of the patient's condition
    @return _hospital The variable to keep the name of the hospital the patient is admitted in
    @return _price The variable to keep donatable amount to help the patient
    @return _cleared A boolean value to check if patient bill has been cleared
    */
    function readPatient(uint _index) public view returns (
        address payable _owner,
        string memory _name , 
        string memory _image, 
        string memory _description, 
        string memory _hospital, 
        uint _price, 
        bool _cleared
    ) {
        return (
            patients[_index].owner,
            patients[_index].name, 
            patients[_index].image, 
            patients[_index].description, 
            patients[_index].hospital, 
            patients[_index].price,
            patients[_index].cleared
        );
    }

    /**
    @notice Clearing a patient's bill
    @dev assert that the patient is not cleared then ensure user has paid the bill of the patients and on completion, emit the donation function
    @param _index The patients unique Number.
    */
    function buyPatient(uint _index) public payable {
        require(patients[_index].cleared == false,"Thank you, unfortunately, the patient has been cleared already.");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            patients[_index].owner,
            patients[_index].price
          ),
          "Transfer failed."
        );
        patients[_index].cleared=true;
         emit donation(msg.sender,patients[_index].name, patients[_index].price, block.timestamp);
    }
    /// Get the total list of patient currently in the  hospital(smart contract)
    function getpatientsLength() public view returns (uint) {
        return (patientsLength);
    }


/// struct to organize fundraising details
    struct Fundraise
    {
        address payable owner;
        string title;
        string image;
        string description;
        uint goal;
        uint funded;
        bool Ended;
    }


    ///mapping for the fundraise struct
    mapping(uint => Fundraise) internal fundraise;
    
    /**
    @notice modifier function to check whether owner of the project is the same as one interacting with it currently
    @dev function to delete/hide an already created fundraise project
    */
     function removeProject(uint _id) public {
         require(msg.sender == fundraise[_id].owner, "Sorry,you dont own this fundraising project");
        fundraise[_id].Ended= true;
    }

    /// get the total number of fundraising projects so far.
     function numbeOfProjects() public view returns(uint){
        return projectLength;
    }


    /**
    @notice Create a new fundraising project
    @param _title The title of the fundraiser project
    @param _image The image of the fundraiser project
    @param _description The description of the fundraiser project
    @dev increase vaalue of projectlength by 1
    */
    function newFundraise(
        string calldata _title,
        string calldata _image, 
        string calldata _description, 
        uint _goal
        ) 
         public InWhitelist
         {

            bool _Ended = false;
            fundraise[projectLength] = Fundraise(
            payable(msg.sender), 
            _title,
            _image, 
            _description, 
            _goal, 
             0, 
            _Ended
         );
            
         projectLength++;
    }


    /**
    @notice Get specific project with id
    @param _id the unsigned integer assigned to the project 
    @return owner The owner of the project that needs fund raiser
    @return title The title of the fund raiser
    @return image The image of the project needing funds
    @return description The description of the project needing funds
    @return goal The goal to be reached that ends the funding needed for this project
    @return funded The total amount funded so far
    @return Ended a True or False variable stating if the project has been funded or not

    */
    function getAllProjects(uint _id) 
    public view 

    returns(
        address payable owner,  
        string memory title, 
        string memory image, 
        string memory description, 
        uint goal, 
        uint funded, 
        bool Ended
        ) 
    {
    
        return (
            fundraise[_id].owner, 
            fundraise[_id].title, 
            fundraise[_id].image,
            fundraise[_id].description, 
            fundraise[_id].goal, 
            fundraise[_id].funded, 
            fundraise[_id].Ended
        );
    }



    /// Contribute to a fundraising project. 
    function contribute(uint _id, uint _amount)  public {

        /// the owner cant donate to themselves
        require(msg.sender != fundraise[_id].owner, "you cant donate to your own project.");

        /// transfer the specified amount to the project owner
        require(IERC20Token(cUsdTokenAddress)
            .transferFrom(msg.sender, fundraise[_id].owner, _amount), "Transaction failed, please try again.");
        
        /// increment the project funds
        fundraise[_id].funded += _amount;

        if (fundraise[_id].funded >= fundraise[_id].goal){
            fundraise[_id].Ended = true;
        }
        /// emit a donation event for the participant
        emit donation(msg.sender, fundraise[_id].title, _amount, block.timestamp);
    }

}




