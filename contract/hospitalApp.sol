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


        /// track addresses if whitelisted or not
     mapping(address => bool) public whitelistedAddresses;

    /// an array to hold whitelisted addresses
    address[] whitelistedAddress;


    //when an address is whitelisted.
    event addressWhitelisted(address indexed whitelistaddress);
    event donation(address indexed donationFrom, string indexed _name, uint256 amount,uint256 timeOfDonation);


     //adding an address to the whitelist array
    function whitelistAddress() public {
        //check whether the address is already whitelisted
        require(!whitelistedAddresses[msg.sender], "Your Address is already whitelisted");
        whitelistedAddresses[msg.sender] = true;

        whitelistedAddress.push(msg.sender);

        emit addressWhitelisted(msg.sender);
    }


     modifier InWhitelist(){
                require(whitelistedAddresses[msg.sender] == true, "not whitelisted");
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

    mapping (uint => Patient) internal patients;

    function writePatient(
        string memory _name,
        string memory _image,
        string memory _description, 
        string memory _hospital, 
        uint _price
    ) public InWhitelist{
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

    function readPatient(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory, 
        string memory, 
        uint, 
        bool
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

//function to clear thepatient's bills
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
    //get all the patients registered as of now
    function getpatientsLength() public view returns (uint) {
        return (patientsLength);
    }

// Fundraise struct
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
    
    /*modifier function to check whether owner of the project is 
    the same as one interacting with it currently
    */
    modifier ownerOnly(uint _id){
        require(msg.sender == fundraise[_id].owner, "Sorry,you dont own this fundraising project");
        _;
    }

    //function to delete/hide an already created fundraise project
     function removeProject(uint _id) public ownerOnly(_id){
        fundraise[_id].Ended= true;
    }

    // get the total number of fundraising projects so far.
     function numbeOfProjects() public view returns(uint){
        return projectLength;
    }


    //Create a new fundraising project
    function newFundraise(
        string memory _title,
        string memory _image, 
        string memory _description, 
        uint _goal
        ) 
         public{

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
    function getAllProjects(uint _id) public view returns(address payable,  string memory, string memory, string memory, uint, uint, bool) {
    
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





