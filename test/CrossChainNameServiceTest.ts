import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { CrossChainNameServiceRegister, CrossChainNameServiceReceiver, CrossChainNameServiceLookup, CCIPLocalSimulator } from "../typechain-types";

async function deploy() {
  const localSimulatorFactory = await ethers.getContractFactory("CCIPLocalSimulator");
  const localSimulator = await localSimulatorFactory.deploy();

  const config = await localSimulator.configuration();

  return { localSimulator, config };
}

describe("CrossChainNameService Integration Test", function () {
  let ccipLocalSimulator: CCIPLocalSimulator;
  let register: CrossChainNameServiceRegister;
  let receiver: CrossChainNameServiceReceiver;
  let lookup: CrossChainNameServiceLookup;

  let deployer: string;
  let alice: string;
  let config: {
    chainSelector_: BigNumber;
    sourceRouter_: string;
    destinationRouter_: string;
    wrappedNative_: string;
    linkToken_: string;
    ccipBnM_: string;
    ccipLnM_: string;
  };

  before(async function () {
    [deployer] = await ethers.getSigners().then(signers => signers[0].address);
    alice = ethers.Wallet.createRandom().address;

    const deployment = await deploy();
    ccipLocalSimulator = deployment.localSimulator;
    config = deployment.config;

    // Deploy CrossChainNameServiceLookup contract
    const CrossChainNameServiceLookup = await ethers.getContractFactory("CrossChainNameServiceLookup");
    lookup = await CrossChainNameServiceLookup.deploy() as CrossChainNameServiceLookup;

    // Deploy the CrossChainNameServiceRegister contract
    const CrossChainNameServiceRegister = await ethers.getContractFactory("CrossChainNameServiceRegister");
    register = await CrossChainNameServiceRegister.deploy(config.sourceRouter_, lookup.address) as CrossChainNameServiceRegister;

    // Deploy the CrossChainNameServiceReceiver contract
    const CrossChainNameServiceReceiver = await ethers.getContractFactory("CrossChainNameServiceReceiver");
    receiver = await CrossChainNameServiceReceiver.deploy(config.destinationRouter_, lookup.address, config.chainSelector_) as CrossChainNameServiceReceiver;

    // Enable chains in Register and Receiver
    await register.enableChain(config.chainSelector_, receiver.address, 1000000);

    // Set Cross Chain Name Service Address
    await lookup.setCrossChainNameServiceAddress(register.address);
    await lookup.setCrossChainNameServiceAddress(receiver.address);
  });

  it("should register and lookup a name correctly", async function () {
    const name = "alice.ccns";
    await register.register(name);

    const retrievedAddress = await lookup.lookup(name);
    expect(retrievedAddress).to.equal(alice);
  });
});
