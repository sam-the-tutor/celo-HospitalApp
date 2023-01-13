// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

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

    uint internal patientsLength = 0;
    uint internal projectLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


    // track addresses if whitelisted or not
     mapping(address => bool) public hasBeenWhiteListed;

    //mapping a patient struct.
     mapping (uint => Patient) internal patients;


    // an array to hold whitelisted addresses
     address[] whitelistedAddress;


    //when an address is whitelisted.
    event addressWhitelisted(address indexed whitelistaddress);
    event donation(address indexed donationFrom, string indexed _name, uint256 amount,uint256 timeOfDonation);


     //adding an address to the whitelist array
    function whitelistAddress() public {
        //check whether the address is already whitelisted
        require(!hasBeenWhiteListed[msg.sender], "Your Address is already whitelisted");
        hasBeenWhiteListed[msg.sender] = true;

        whitelistedAddress.push(msg.sender);

        emit addressWhitelisted(msg.sender);
    }


     modifier InWhitelist(){
                require(hasBeenWhiteListed[msg.sender], "not whitelisted");
                _;
    }


    struct Patient {
        address payable owner;
        string name;
        string image;
        string description;
        string hospital;
        uint price;
        bool cleared;
    }

    

    function writePatient(
        string calldata _name,
        string calldata _image,
        string calldata _description, 
        string calldata _hospital, 
        uint _price

    ) 
    public InWhitelist
    {
        require(bytes(_name).length > 0, "Invalid string");
        require(bytes(_image).length > 0, "Invalid string");
        require(bytes(_description).length > 0, "Invalid string");
        require(bytes(_hospital).length > 0, "Invalid string");

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

//read patient details in a specific index
    function readPatient(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory, 
        string memory, 
        uint, 
        bool
    ) {
        Patient storage patient = patients[_index];
        return (
            patient.owner,
            patient.name, 
            patient.image, 
            patient.description, 
            patient.hospital, 
            patient.price,
            patient.cleared
        );
    }

//function to clear thepatient's bills
    function clearPatientBill(uint _index) public payable {
        Patient storage patient = patients[_index];
        require (msg.sender != patient.owner, "Owner cannot help  patient");
        require(patient.cleared == false,"Thank you, unfortunately, the patient has been cleared already.");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            patient.owner,
            patient.price
          ),
          "Transfer failed."
        );
        patient.cleared=true;
         emit donation(msg.sender,patient.name, patient.price, block.timestamp);
    }
    //get all the patients registered as of now
    function getpatientsLength() public view returns (uint) {
        return (patientsLength);
    }


    function getWhiteListAddresses() public view returns(address[] memory){
        return whitelistedAddress;
    }


// struct to organize fundraising details
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


    //mapping for the fundraise struct
    mapping(uint => Fundraise) internal fundraise;
    
    //function to delete/hide an already created fundraise project
     function removeProject(uint _id) public {
        require(msg.sender == fundraise[_id].owner, "Sorry,you dont own this fundraising project");
        fundraise[_id].Ended= true;
    }

    // get the total number of fundraising projects so far.
     function numbeOfProjects() public view returns(uint){
        return projectLength;
    }


    //Create a new fundraising project
    function newFundraise(
        string calldata _title,
        string calldata _image, 
        string calldata _description, 
        uint _goal
        ) 
         public InWhitelist
         {
            require(bytes(_title).length > 0, "Invalid string");
            require(bytes(_image).length > 0, "Invalid string");
            require(bytes(_description).length > 0, "Invalid string");

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


    //Get specific project with id
    function getAllProjects(uint _id) 
    public view 

    returns(
        address payable,  
        string memory, 
        string memory, 
        string memory, 
        uint, 
        uint, 
        bool
        ) 
    {
        Fundraise storage project = fundraise[_id];
        return (
            project.owner, 
            project.title, 
            project.image,
            project.description, 
            project.goal, 
            project.funded, 
            project.Ended
        );
    }



    //Contribute to a fundraising project. 
    function contribute(uint _id, uint _amount)  public {

        //the owner cant donate to themselves
        require(msg.sender != fundraise[_id].owner, "you cant donate to your own project.");

        //transfer the specified amount to the project owner
        require(IERC20Token(cUsdTokenAddress)
            .transferFrom(msg.sender, fundraise[_id].owner, _amount), "Transaction failed, please try again.");
        
        //increment the project funds
        fundraise[_id].funded += _amount;

        if (fundraise[_id].funded >= fundraise[_id].goal){
            fundraise[_id].Ended = true;
        }
        //emit a donation event for the participant
        emit donation(msg.sender, fundraise[_id].title, _amount, block.timestamp);
    }

}





