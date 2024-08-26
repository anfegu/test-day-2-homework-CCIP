/* // SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

import "../contracts/CrossChainNameServiceRegister.sol";
import "../contracts/CrossChainNameServiceReceiver.sol";
import "../contracts/CrossChainNameServiceLookup.sol";
import {CCIPLocalSimulator, 
        IRouterClient, 
        WETH9, 
        LinkToken, 
        BurnMintERC677Helper} from "@chainlink/local/src/ccip/CCIPLocalSimulator.sol";


contract CrossChainNameServiceTest {
    CCIPLocalSimulator public ccipLocalSimulator;
    CrossChainNameServiceRegister private register;
    CrossChainNameServiceReceiver private receiver;
    CrossChainNameServiceLookup private lookup;

    address private deployer;
    address private alice;

    function setUp() public {
        deployer = address(this);
        alice = address(0x123);

        // Deploy CrossChainNameServiceLookup contract first
        lookup = new CrossChainNameServiceLookup();

        // Deploy CCIPLocalSimulator contract
        ccipLocalSimulator = new CCIPLocalSimulator();
        (
            uint64 chainSelector,
            IRouterClient sourceRouter,
            IRouterClient destinationRouter,
            WETH9 wrappedNative,
            LinkToken linkToken,
            BurnMintERC677Helper ccipBnM,
            BurnMintERC677Helper ccipLnM
        ) = ccipLocalSimulator.configuration();

        // Deploy the CrossChainNameServiceRegister contract
        register = new CrossChainNameServiceRegister(address(sourceRouter), address(lookup));

        // Deploy the CrossChainNameServiceReceiver contract
        receiver = new CrossChainNameServiceReceiver(address(destinationRouter), address(lookup), chainSelector);

        // Enable chains in Register and Receiver
        register.enableChain(chainSelector, address(receiver), 1000000); // Gas limit I chose arbitrarily

        // Set Cross Chain Name Service Address
        lookup.setCrossChainNameServiceAddress(address(register));
        lookup.setCrossChainNameServiceAddress(address(receiver));
    }

    function testRegisterAndLookup() public {
        // Register a name with Alice's address
        string memory name = "alice.ccns";
        register.register(name);  // Passing Alice's address

        // Lookup the registered name
        address retrievedAddress = lookup.lookup(name);

        // Assert that the retrieved address matches Alice's address
        assert(retrievedAddress == alice);
    }
}
 */