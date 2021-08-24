"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = void 0;
const graphql_request_1 = require("graphql-request");
const getPool = async (poolId, blockNumber, testnet) => {
    const data = `
    id
    address
    poolType
    swapFee
    totalShares
    amp
    tokens {
      id
      address
      symbol
      balance
      decimals
      weight
    }
  `;
    let query;
    if (blockNumber) {
        query = graphql_request_1.gql `
      query getPool($poolId: ID!, $blockNumber: Int!) {
        pools(where: { id: $poolId }, block: { number: $blockNumber }) {
          ${data}
        }
      }
    `;
    }
    else {
        query = graphql_request_1.gql `
      query getPool($poolId: ID!) {
        pools(where: { id: $poolId }) {
          ${data}
        }
      }
    `;
    }
    const result = await graphql_request_1.request(testnet
        ? "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan-v2"
        : "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2", query, { poolId, blockNumber });
    if (result && result.pools && result.pools.length) {
        return result.pools[0];
    }
    return null;
};
exports.getPool = getPool;
