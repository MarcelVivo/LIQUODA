import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('LiquodaProjectToken', () => {
  async function deploy() {
    const [admin, investor, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('LiquodaProjectToken');
    const token = await factory.deploy('LIQUODA Testprojekt', 'LQD-TEST', 30000, 'project-uuid', admin.address);
    await token.waitForDeployment();
    return { token, admin, investor, other };
  }

  it('hat 0 Dezimalstellen, Cap und Projekt-Referenz', async () => {
    const { token } = await deploy();
    expect(await token.decimals()).to.equal(0);
    expect(await token.cap()).to.equal(30000n);
    expect(await token.projectRef()).to.equal('project-uuid');
  });

  it('mintet nur an allowlistete Wallets', async () => {
    const { token, investor } = await deploy();
    await expect(token.mint(investor.address, 1000, 'inv-1')).to.be.revertedWithCustomError(token, 'NotAllowlisted');
    await token.setAllowed(investor.address, true);
    await expect(token.mint(investor.address, 1000, 'inv-1')).to.emit(token, 'Minted').withArgs(investor.address, 1000, 'inv-1');
    expect(await token.balanceOf(investor.address)).to.equal(1000n);
  });

  it('respektiert den Cap', async () => {
    const { token, investor } = await deploy();
    await token.setAllowed(investor.address, true);
    await token.mint(investor.address, 30000, 'inv-1');
    await expect(token.mint(investor.address, 1, 'inv-2')).to.be.revertedWithCustomError(token, 'ERC20ExceededCap');
  });

  it('erlaubt Transfers nur zwischen allowlisteten Wallets', async () => {
    const { token, investor, other } = await deploy();
    await token.setAllowed(investor.address, true);
    await token.mint(investor.address, 500, 'inv-1');
    await expect(token.connect(investor).transfer(other.address, 100)).to.be.revertedWithCustomError(token, 'NotAllowlisted');
    await token.setAllowed(other.address, true);
    await token.connect(investor).transfer(other.address, 100);
    expect(await token.balanceOf(other.address)).to.equal(100n);
  });

  it('blockiert Mint und Transfer im Pausenzustand', async () => {
    const { token, investor, other } = await deploy();
    await token.setAllowed(investor.address, true);
    await token.setAllowed(other.address, true);
    await token.mint(investor.address, 500, 'inv-1');
    await token.pause();
    await expect(token.mint(investor.address, 1, 'inv-2')).to.be.revertedWithCustomError(token, 'EnforcedPause');
    await expect(token.connect(investor).transfer(other.address, 1)).to.be.revertedWithCustomError(token, 'EnforcedPause');
    await token.unpause();
    await token.connect(investor).transfer(other.address, 1);
  });

  it('schützt Rollen', async () => {
    const { token, investor, other } = await deploy();
    await expect(token.connect(other).mint(investor.address, 1, 'x')).to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount');
    await expect(token.connect(other).setAllowed(investor.address, true)).to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount');
    await expect(token.connect(other).pause()).to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount');
    await expect(token.connect(other).registerDocument(ethers.ZeroHash, 'x')).to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount');
  });

  it('registriert Dokument-Hashes genau einmal', async () => {
    const { token } = await deploy();
    const hash = ethers.keccak256(ethers.toUtf8Bytes('dokument'));
    await expect(token.registerDocument(hash, 'Projektbeschrieb v1')).to.emit(token, 'DocumentRegistered').withArgs(hash, 'Projektbeschrieb v1');
    expect(await token.isDocumentRegistered(hash)).to.equal(true);
    await expect(token.registerDocument(hash, 'nochmal')).to.be.revertedWithCustomError(token, 'DocumentAlreadyRegistered');
  });
});
