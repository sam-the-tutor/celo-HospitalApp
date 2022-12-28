

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
        bool pStatus;
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

    function newFundraise(
    	string memory _title, 
    	string memory _image, 
        string memory _description, 
        uint _goal
        ) 
            public{

                    pStatus = true;
                    fundraise[projectLength] = Fundraise(payable(msg.sender), _title,  _image,_description, _goal, 0, pStatus);
                    emit projectCreated(msg.sender,_title);
                    projectLength++;
    }


    //function to get all the fundraising projects

    function getProjectDetails(uint _id) public view returns(address payable, string memory, string memory, string memory, uint, uint, bool) {
    
        return (
            fundraise[_id].owner, 
            fundraise[_id].title, 
            fundraise[_id].image, 
            fundraise[_id].description,
            fundraise[_id].goal, 
            fundraise[_id].funded, 
            fundraise[_id].pStatus
        
        );
    }


    //function to contribute to a fundraising project. 

    function contribute(uint _id, uint _amount) public payable{

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