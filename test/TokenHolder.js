const Holder = artifacts.require("TokenHolder.sol");
const Token = artifacts.require("MockToken.sol");

const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;
const randomAddress = tests.randomAddress;
const increaseTime = tests.increaseTime;

contract('TokenHolder', function(accounts) {

  function now() {
    return parseInt(new Date().getTime() / 1000);
  }

  async function increaseDays(days) {
    await increaseTime(86400 * days);
  }

  it("should not allow to release at start", async function() {
    var token = await Token.new();
    var holder = await Holder.new(now(), 100, token.address);
    await token.mint(holder.address, 100000);

    await expectThrow(
        holder.release()
    );
  })

  it("should not allow to release if not owner", async function() {
    var token = await Token.new();
    var holder = await Holder.new(now() - 86400 * 200, 100, token.address);
    await token.mint(holder.address, 100000);

    await expectThrow(
        holder.release({from: accounts[1]})
    );
  })

  it("should allow to release 100 after 6 months", async function() {
    var token = await Token.new();
    var holder = await Holder.new(now() - 86400 * 200, 100, token.address);
    await token.mint(holder.address, 100000);

    await holder.release();
    assert.equal(await token.balanceOf(accounts[0]), 100);
  })

  it("should not allow to release more than 100 after 6 months", async function() {
    var token = await Token.new();
    var holder = await Holder.new(now() - 86400 * 200, 100, token.address);
    await token.mint(holder.address, 100000);

    await holder.release();
    assert.equal(await token.balanceOf(accounts[0]), 100);

    await expectThrow(
        holder.release()
    );
  })

  it("should allow to release 200 after 12 months", async function() {
    var token = await Token.new();
    var holder = await Holder.new(now() - 86400 * 400, 100, token.address);
    await token.mint(holder.address, 100000);

    await holder.release();
    assert.equal(await token.balanceOf(accounts[0]), 200);
  })

  it("should release if left a little bit", async () => {
    var token = await Token.new();
    var holder = await Holder.new(now() - 86400 * 500, 100, token.address);
    await token.mint(holder.address, 50);

    await holder.release();
    assert.equal(await token.balanceOf(accounts[0]), 50);
    assert.equal(await token.balanceOf(holder.address), 0);
  });

  it("should release 100 tokens every 6 months", async function() {
    var token = await Token.new();
    var holder = await Holder.new(now(), 100, token.address);
    await token.mint(holder.address, 100000);

    await expectThrow(
        holder.release()
    );

    await increaseDays(183);
    await holder.release();
    assert.equal(await token.balanceOf(accounts[0]), 100);
    await expectThrow(
        holder.release()
    );

    await increaseDays(182);
    await expectThrow(
        holder.release()
    );
    await increaseDays(1);
    await holder.release();
    assert.equal(await token.balanceOf(accounts[0]), 200);
  });
});