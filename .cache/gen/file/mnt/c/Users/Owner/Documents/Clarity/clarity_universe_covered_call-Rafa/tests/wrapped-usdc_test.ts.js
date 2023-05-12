import { Clarinet, Tx, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
Clarinet.test({
    name: "Mint::Success",
    async fn (chain, accounts) {
        let deployer = accounts.get('deployer');
        let wallet2 = accounts.get('wallet_2');
        let totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(0);
        let block = chain.mineBlock([
            Tx.contractCall('wrapped-usdc', 'mint', [
                types.uint(123456),
                types.principal(wallet2.address)
            ], deployer.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk();
        totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(123456);
        let wallet2Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet2.address)
        ], wallet2.address);
        wallet2Balance.result.expectOk().expectUint(123456);
    }
});
Clarinet.test({
    name: "Mint::Failure::NotContractOwner",
    async fn (chain, accounts) {
        let deployer = accounts.get('deployer');
        let wallet2 = accounts.get('wallet_2');
        let totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(0);
        let block = chain.mineBlock([
            Tx.contractCall('wrapped-usdc', 'mint', [
                types.uint(123456),
                types.principal(wallet2.address)
            ], wallet2.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectErr().expectUint(100);
        totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(0);
    }
});
Clarinet.test({
    name: "Transfer::Success",
    async fn (chain, accounts) {
        let deployer = accounts.get('deployer');
        let wallet1 = accounts.get('wallet_1');
        let wallet2 = accounts.get('wallet_2');
        let totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(0);
        let block = chain.mineBlock([
            Tx.contractCall('wrapped-usdc', 'mint', [
                types.uint(123456),
                types.principal(wallet1.address)
            ], deployer.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk();
        totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(123456);
        let wallet1Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet1.address)
        ], wallet1.address);
        wallet1Balance.result.expectOk().expectUint(123456);
        block = chain.mineBlock([
            Tx.contractCall('wrapped-usdc', 'transfer', [
                types.uint(7337),
                types.principal(wallet1.address),
                types.principal(wallet2.address),
                types.none()
            ], wallet1.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        block.receipts[0].result.expectOk();
        wallet1Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet1.address)
        ], wallet1.address);
        wallet1Balance.result.expectOk().expectUint(123456 - 7337);
        let wallet2Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet2.address)
        ], wallet2.address);
        wallet2Balance.result.expectOk().expectUint(7337);
    }
});
Clarinet.test({
    name: "Transfer::Failure::Invalid Owner",
    async fn (chain, accounts) {
        let deployer = accounts.get('deployer');
        let wallet1 = accounts.get('wallet_1');
        let wallet2 = accounts.get('wallet_2');
        let totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(0);
        let block = chain.mineBlock([
            Tx.contractCall('wrapped-usdc', 'mint', [
                types.uint(123456),
                types.principal(wallet1.address)
            ], deployer.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk();
        totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(123456);
        let wallet1Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet1.address)
        ], wallet1.address);
        wallet1Balance.result.expectOk().expectUint(123456);
        block = chain.mineBlock([
            Tx.contractCall('wrapped-usdc', 'transfer', [
                types.uint(7337),
                types.principal(wallet1.address),
                types.principal(wallet2.address),
                types.none()
            ], wallet2.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        block.receipts[0].result.expectErr().expectUint(101);
        wallet1Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet1.address)
        ], wallet1.address);
        wallet1Balance.result.expectOk().expectUint(123456);
        let wallet2Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet2.address)
        ], wallet2.address);
        wallet2Balance.result.expectOk().expectUint(0);
    }
});
Clarinet.test({
    name: "Transfer::Failure::Insufficient Balace",
    async fn (chain, accounts) {
        let deployer = accounts.get('deployer');
        let wallet1 = accounts.get('wallet_1');
        let wallet2 = accounts.get('wallet_2');
        let totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(0);
        let block = chain.mineBlock([
            Tx.contractCall('wrapped-usdc', 'mint', [
                types.uint(123456),
                types.principal(wallet1.address)
            ], deployer.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk();
        totalSupply = chain.callReadOnlyFn('wrapped-usdc', 'get-total-supply', [], deployer.address);
        totalSupply.result.expectOk().expectUint(123456);
        let wallet1Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet1.address)
        ], wallet1.address);
        wallet1Balance.result.expectOk().expectUint(123456);
        block = chain.mineBlock([
            Tx.contractCall('wrapped-usdc', 'transfer', [
                types.uint(73377337),
                types.principal(wallet1.address),
                types.principal(wallet2.address),
                types.none()
            ], wallet1.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        https: block.receipts[0].result.expectErr().expectUint(1);
        wallet1Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet1.address)
        ], wallet1.address);
        wallet1Balance.result.expectOk().expectUint(123456);
        let wallet2Balance = chain.callReadOnlyFn('wrapped-usdc', 'get-balance', [
            types.principal(wallet2.address)
        ], wallet2.address);
        wallet2Balance.result.expectOk().expectUint(0);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vbW50L2MvVXNlcnMvT3duZXIvRG9jdW1lbnRzL0NsYXJpdHkvY2xhcml0eV91bml2ZXJzZV9jb3ZlcmVkX2NhbGwtUmFmYS90ZXN0cy93cmFwcGVkLXVzZGNfdGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDbGFyaW5ldCwgVHgsIENoYWluLCBBY2NvdW50LCB0eXBlcyB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvY2xhcmluZXRAdjAuMTQuMC9pbmRleC50cyc7XG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tICdodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45MC4wL3Rlc3RpbmcvYXNzZXJ0cy50cyc7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiTWludDo6U3VjY2Vzc1wiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGxldCBkZXBsb3llciA9IGFjY291bnRzLmdldCgnZGVwbG95ZXInKSE7XG4gICAgICAgIGxldCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KCd3YWxsZXRfMicpITtcblxuICAgICAgICBsZXQgdG90YWxTdXBwbHkgPSBjaGFpbi5jYWxsUmVhZE9ubHlGbignd3JhcHBlZC11c2RjJywgJ2dldC10b3RhbC1zdXBwbHknLCBbXSwgZGVwbG95ZXIuYWRkcmVzcyk7XG4gICAgICAgIHRvdGFsU3VwcGx5LnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFVpbnQoMClcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCd3cmFwcGVkLXVzZGMnLCAnbWludCcsIFt0eXBlcy51aW50KDEyMzQ1NiksIHR5cGVzLnByaW5jaXBhbCh3YWxsZXQyLmFkZHJlc3MpXSwgZGVwbG95ZXIuYWRkcmVzcykgICAgICAgICAgICBcbiAgICAgICAgXSk7XG5cbiAgICAgICAgYXNzZXJ0RXF1YWxzKGJsb2NrLnJlY2VpcHRzLmxlbmd0aCwgMSk7XG4gICAgICAgIGFzc2VydEVxdWFscyhibG9jay5oZWlnaHQsIDIpO1xuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0T2soKTtcblxuICAgICAgICB0b3RhbFN1cHBseSA9IGNoYWluLmNhbGxSZWFkT25seUZuKCd3cmFwcGVkLXVzZGMnLCAnZ2V0LXRvdGFsLXN1cHBseScsIFtdLCBkZXBsb3llci5hZGRyZXNzKTtcbiAgICAgICAgdG90YWxTdXBwbHkucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCgxMjM0NTYpOyBcblxuICAgICAgICBsZXQgd2FsbGV0MkJhbGFuY2UgPSBjaGFpbi5jYWxsUmVhZE9ubHlGbignd3JhcHBlZC11c2RjJywgJ2dldC1iYWxhbmNlJywgW3R5cGVzLnByaW5jaXBhbCh3YWxsZXQyLmFkZHJlc3MpXSwgd2FsbGV0Mi5hZGRyZXNzKTtcbiAgICAgICAgd2FsbGV0MkJhbGFuY2UucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCgxMjM0NTYpOyBcbiAgICB9XG59KVxuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcIk1pbnQ6OkZhaWx1cmU6Ok5vdENvbnRyYWN0T3duZXJcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBsZXQgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoJ2RlcGxveWVyJykhO1xuICAgICAgICBsZXQgd2FsbGV0MiA9IGFjY291bnRzLmdldCgnd2FsbGV0XzInKSE7XG5cbiAgICAgICAgbGV0IHRvdGFsU3VwcGx5ID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oJ3dyYXBwZWQtdXNkYycsICdnZXQtdG90YWwtc3VwcGx5JywgW10sIGRlcGxveWVyLmFkZHJlc3MpO1xuICAgICAgICB0b3RhbFN1cHBseS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RVaW50KDApXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnd3JhcHBlZC11c2RjJywgJ21pbnQnLCBbdHlwZXMudWludCgxMjM0NTYpLCB0eXBlcy5wcmluY2lwYWwod2FsbGV0Mi5hZGRyZXNzKV0sIHdhbGxldDIuYWRkcmVzcykgICAgICAgICAgICBcbiAgICAgICAgXSk7XG5cbiAgICAgICAgYXNzZXJ0RXF1YWxzKGJsb2NrLnJlY2VpcHRzLmxlbmd0aCwgMSk7XG4gICAgICAgIGFzc2VydEVxdWFscyhibG9jay5oZWlnaHQsIDIpO1xuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMDApO1xuXG4gICAgICAgIHRvdGFsU3VwcGx5ID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oJ3dyYXBwZWQtdXNkYycsICdnZXQtdG90YWwtc3VwcGx5JywgW10sIGRlcGxveWVyLmFkZHJlc3MpO1xuICAgICAgICB0b3RhbFN1cHBseS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RVaW50KDApOyBcbiAgICB9XG59KVxuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcIlRyYW5zZmVyOjpTdWNjZXNzXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgbGV0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KCdkZXBsb3llcicpITtcbiAgICAgICAgbGV0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoJ3dhbGxldF8xJykhO1xuICAgICAgICBsZXQgd2FsbGV0MiA9IGFjY291bnRzLmdldCgnd2FsbGV0XzInKSE7XG5cbiAgICAgICAgbGV0IHRvdGFsU3VwcGx5ID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oJ3dyYXBwZWQtdXNkYycsICdnZXQtdG90YWwtc3VwcGx5JywgW10sIGRlcGxveWVyLmFkZHJlc3MpO1xuICAgICAgICB0b3RhbFN1cHBseS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RVaW50KDApXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnd3JhcHBlZC11c2RjJywgJ21pbnQnLCBbdHlwZXMudWludCgxMjM0NTYpLCB0eXBlcy5wcmluY2lwYWwod2FsbGV0MS5hZGRyZXNzKV0sIGRlcGxveWVyLmFkZHJlc3MpICAgICAgICAgICAgXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGFzc2VydEVxdWFscyhibG9jay5yZWNlaXB0cy5sZW5ndGgsIDEpO1xuICAgICAgICBhc3NlcnRFcXVhbHMoYmxvY2suaGVpZ2h0LCAyKTtcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdE9rKCk7XG5cbiAgICAgICAgdG90YWxTdXBwbHkgPSBjaGFpbi5jYWxsUmVhZE9ubHlGbignd3JhcHBlZC11c2RjJywgJ2dldC10b3RhbC1zdXBwbHknLCBbXSwgZGVwbG95ZXIuYWRkcmVzcyk7XG4gICAgICAgIHRvdGFsU3VwcGx5LnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFVpbnQoMTIzNDU2KTsgXG5cbiAgICAgICAgbGV0IHdhbGxldDFCYWxhbmNlID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oJ3dyYXBwZWQtdXNkYycsICdnZXQtYmFsYW5jZScsIFt0eXBlcy5wcmluY2lwYWwod2FsbGV0MS5hZGRyZXNzKV0sIHdhbGxldDEuYWRkcmVzcyk7XG4gICAgICAgIHdhbGxldDFCYWxhbmNlLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFVpbnQoMTIzNDU2KTsgXG5cbiAgICAgICAgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCd3cmFwcGVkLXVzZGMnLCAndHJhbnNmZXInLCBbdHlwZXMudWludCg3MzM3KSwgdHlwZXMucHJpbmNpcGFsKHdhbGxldDEuYWRkcmVzcyksIHR5cGVzLnByaW5jaXBhbCh3YWxsZXQyLmFkZHJlc3MpLCB0eXBlcy5ub25lKCldLCB3YWxsZXQxLmFkZHJlc3MpICAgICAgICAgICAgXG4gICAgICAgIF0pO1xuICAgICAgICBhc3NlcnRFcXVhbHMoYmxvY2sucmVjZWlwdHMubGVuZ3RoLCAxKTtcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGJsb2NrLmhlaWdodCwgMyk7XG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RPaygpO1xuXG4gICAgICAgIHdhbGxldDFCYWxhbmNlID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oJ3dyYXBwZWQtdXNkYycsICdnZXQtYmFsYW5jZScsIFt0eXBlcy5wcmluY2lwYWwod2FsbGV0MS5hZGRyZXNzKV0sIHdhbGxldDEuYWRkcmVzcyk7XG4gICAgICAgIHdhbGxldDFCYWxhbmNlLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFVpbnQoMTIzNDU2LTczMzcpOyBcblxuICAgICAgICBsZXQgd2FsbGV0MkJhbGFuY2UgPSBjaGFpbi5jYWxsUmVhZE9ubHlGbignd3JhcHBlZC11c2RjJywgJ2dldC1iYWxhbmNlJywgW3R5cGVzLnByaW5jaXBhbCh3YWxsZXQyLmFkZHJlc3MpXSwgd2FsbGV0Mi5hZGRyZXNzKTtcbiAgICAgICAgd2FsbGV0MkJhbGFuY2UucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCg3MzM3KTsgXG4gICAgfVxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiVHJhbnNmZXI6OkZhaWx1cmU6OkludmFsaWQgT3duZXJcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBsZXQgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoJ2RlcGxveWVyJykhO1xuICAgICAgICBsZXQgd2FsbGV0MSA9IGFjY291bnRzLmdldCgnd2FsbGV0XzEnKSE7XG4gICAgICAgIGxldCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KCd3YWxsZXRfMicpITtcblxuICAgICAgICBsZXQgdG90YWxTdXBwbHkgPSBjaGFpbi5jYWxsUmVhZE9ubHlGbignd3JhcHBlZC11c2RjJywgJ2dldC10b3RhbC1zdXBwbHknLCBbXSwgZGVwbG95ZXIuYWRkcmVzcyk7XG4gICAgICAgIHRvdGFsU3VwcGx5LnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFVpbnQoMClcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCd3cmFwcGVkLXVzZGMnLCAnbWludCcsIFt0eXBlcy51aW50KDEyMzQ1NiksIHR5cGVzLnByaW5jaXBhbCh3YWxsZXQxLmFkZHJlc3MpXSwgZGVwbG95ZXIuYWRkcmVzcykgICAgICAgICAgICBcbiAgICAgICAgXSk7XG5cbiAgICAgICAgYXNzZXJ0RXF1YWxzKGJsb2NrLnJlY2VpcHRzLmxlbmd0aCwgMSk7XG4gICAgICAgIGFzc2VydEVxdWFscyhibG9jay5oZWlnaHQsIDIpO1xuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0T2soKTtcblxuICAgICAgICB0b3RhbFN1cHBseSA9IGNoYWluLmNhbGxSZWFkT25seUZuKCd3cmFwcGVkLXVzZGMnLCAnZ2V0LXRvdGFsLXN1cHBseScsIFtdLCBkZXBsb3llci5hZGRyZXNzKTtcbiAgICAgICAgdG90YWxTdXBwbHkucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCgxMjM0NTYpOyBcblxuICAgICAgICBsZXQgd2FsbGV0MUJhbGFuY2UgPSBjaGFpbi5jYWxsUmVhZE9ubHlGbignd3JhcHBlZC11c2RjJywgJ2dldC1iYWxhbmNlJywgW3R5cGVzLnByaW5jaXBhbCh3YWxsZXQxLmFkZHJlc3MpXSwgd2FsbGV0MS5hZGRyZXNzKTtcbiAgICAgICAgd2FsbGV0MUJhbGFuY2UucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCgxMjM0NTYpOyBcblxuICAgICAgICBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ3dyYXBwZWQtdXNkYycsICd0cmFuc2ZlcicsIFt0eXBlcy51aW50KDczMzcpLCB0eXBlcy5wcmluY2lwYWwod2FsbGV0MS5hZGRyZXNzKSwgdHlwZXMucHJpbmNpcGFsKHdhbGxldDIuYWRkcmVzcyksIHR5cGVzLm5vbmUoKV0sIHdhbGxldDIuYWRkcmVzcykgICAgICAgICAgICBcbiAgICAgICAgXSk7XG4gICAgICAgIGFzc2VydEVxdWFscyhibG9jay5yZWNlaXB0cy5sZW5ndGgsIDEpO1xuICAgICAgICBhc3NlcnRFcXVhbHMoYmxvY2suaGVpZ2h0LCAzKTtcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTAxKTtcblxuICAgICAgICB3YWxsZXQxQmFsYW5jZSA9IGNoYWluLmNhbGxSZWFkT25seUZuKCd3cmFwcGVkLXVzZGMnLCAnZ2V0LWJhbGFuY2UnLCBbdHlwZXMucHJpbmNpcGFsKHdhbGxldDEuYWRkcmVzcyldLCB3YWxsZXQxLmFkZHJlc3MpO1xuICAgICAgICB3YWxsZXQxQmFsYW5jZS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RVaW50KDEyMzQ1Nik7IFxuXG4gICAgICAgIGxldCB3YWxsZXQyQmFsYW5jZSA9IGNoYWluLmNhbGxSZWFkT25seUZuKCd3cmFwcGVkLXVzZGMnLCAnZ2V0LWJhbGFuY2UnLCBbdHlwZXMucHJpbmNpcGFsKHdhbGxldDIuYWRkcmVzcyldLCB3YWxsZXQyLmFkZHJlc3MpO1xuICAgICAgICB3YWxsZXQyQmFsYW5jZS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RVaW50KDApOyBcbiAgICB9XG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJUcmFuc2Zlcjo6RmFpbHVyZTo6SW5zdWZmaWNpZW50IEJhbGFjZVwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGxldCBkZXBsb3llciA9IGFjY291bnRzLmdldCgnZGVwbG95ZXInKSE7XG4gICAgICAgIGxldCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KCd3YWxsZXRfMScpITtcbiAgICAgICAgbGV0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoJ3dhbGxldF8yJykhO1xuXG4gICAgICAgIGxldCB0b3RhbFN1cHBseSA9IGNoYWluLmNhbGxSZWFkT25seUZuKCd3cmFwcGVkLXVzZGMnLCAnZ2V0LXRvdGFsLXN1cHBseScsIFtdLCBkZXBsb3llci5hZGRyZXNzKTtcbiAgICAgICAgdG90YWxTdXBwbHkucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCgwKVxuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ3dyYXBwZWQtdXNkYycsICdtaW50JywgW3R5cGVzLnVpbnQoMTIzNDU2KSwgdHlwZXMucHJpbmNpcGFsKHdhbGxldDEuYWRkcmVzcyldLCBkZXBsb3llci5hZGRyZXNzKSAgICAgICAgICAgIFxuICAgICAgICBdKTtcblxuICAgICAgICBhc3NlcnRFcXVhbHMoYmxvY2sucmVjZWlwdHMubGVuZ3RoLCAxKTtcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGJsb2NrLmhlaWdodCwgMik7XG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RPaygpO1xuXG4gICAgICAgIHRvdGFsU3VwcGx5ID0gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oJ3dyYXBwZWQtdXNkYycsICdnZXQtdG90YWwtc3VwcGx5JywgW10sIGRlcGxveWVyLmFkZHJlc3MpO1xuICAgICAgICB0b3RhbFN1cHBseS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RVaW50KDEyMzQ1Nik7IFxuXG4gICAgICAgIGxldCB3YWxsZXQxQmFsYW5jZSA9IGNoYWluLmNhbGxSZWFkT25seUZuKCd3cmFwcGVkLXVzZGMnLCAnZ2V0LWJhbGFuY2UnLCBbdHlwZXMucHJpbmNpcGFsKHdhbGxldDEuYWRkcmVzcyldLCB3YWxsZXQxLmFkZHJlc3MpO1xuICAgICAgICB3YWxsZXQxQmFsYW5jZS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RVaW50KDEyMzQ1Nik7IFxuXG4gICAgICAgIGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnd3JhcHBlZC11c2RjJywgJ3RyYW5zZmVyJywgW3R5cGVzLnVpbnQoNzMzNzczMzcpLCB0eXBlcy5wcmluY2lwYWwod2FsbGV0MS5hZGRyZXNzKSwgdHlwZXMucHJpbmNpcGFsKHdhbGxldDIuYWRkcmVzcyksIHR5cGVzLm5vbmUoKV0sIHdhbGxldDEuYWRkcmVzcykgICAgICAgICAgICBcbiAgICAgICAgXSk7XG4gICAgICAgIGFzc2VydEVxdWFscyhibG9jay5yZWNlaXB0cy5sZW5ndGgsIDEpO1xuICAgICAgICBhc3NlcnRFcXVhbHMoYmxvY2suaGVpZ2h0LCAzKTtcbiAgICAgICAgOztodHRwczovL2RvY3Muc3RhY2tzLmNvL3JlZmVyZW5jZXMvbGFuZ3VhZ2UtZnVuY3Rpb25zI2Z0LXRyYW5zZmVyXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEpOyAgXG5cbiAgICAgICAgd2FsbGV0MUJhbGFuY2UgPSBjaGFpbi5jYWxsUmVhZE9ubHlGbignd3JhcHBlZC11c2RjJywgJ2dldC1iYWxhbmNlJywgW3R5cGVzLnByaW5jaXBhbCh3YWxsZXQxLmFkZHJlc3MpXSwgd2FsbGV0MS5hZGRyZXNzKTtcbiAgICAgICAgd2FsbGV0MUJhbGFuY2UucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCgxMjM0NTYpOyBcblxuICAgICAgICBsZXQgd2FsbGV0MkJhbGFuY2UgPSBjaGFpbi5jYWxsUmVhZE9ubHlGbignd3JhcHBlZC11c2RjJywgJ2dldC1iYWxhbmNlJywgW3R5cGVzLnByaW5jaXBhbCh3YWxsZXQyLmFkZHJlc3MpXSwgd2FsbGV0Mi5hZGRyZXNzKTtcbiAgICAgICAgd2FsbGV0MkJhbGFuY2UucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VWludCgwKTsgXG4gICAgfVxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxRQUFRLEVBQUUsRUFBRSxFQUFrQixLQUFLLFFBQVEsK0NBQStDLENBQUM7QUFDcEcsU0FBUyxZQUFZLFFBQVEsaURBQWlELENBQUM7QUFFL0UsUUFBUSxDQUFDLElBQUksQ0FBQztJQUNWLElBQUksRUFBRSxlQUFlO0lBQ3JCLE1BQU0sRUFBRSxFQUFDLEtBQVksRUFBRSxRQUE4QixFQUFFO1FBQ25ELElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEFBQUMsQUFBQztRQUN6QyxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxBQUFDLEFBQUM7UUFFeEMsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsQUFBQztRQUNqRyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFM0MsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUN4QixFQUFFLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUU7Z0JBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO2FBQUMsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDO1NBQ3BILENBQUMsQUFBQztRQUVILFlBQVksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5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Q0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVuRCxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFO1lBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1NBQUMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUgsY0FBYyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFcEQsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFO1lBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1NBQUMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEFBQUM7UUFDOUgsY0FBYyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDbEQ7Q0FDSixDQUFDLENBQUMifQ==