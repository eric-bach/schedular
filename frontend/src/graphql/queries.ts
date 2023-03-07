export const GET_ACCOUNTS = `query GetAccounts($userId: String!, $lastEvaluatedKey: LastEvaluatedKey) {
    getAccounts(userId: $userId, lastEvaluatedKey: $lastEvaluatedKey) {
      items {
        userId
        sk
        aggregateId
        type
        name
        description
        currencies {
          currency
          bookValue
          marketValue
        }
      }
      lastEvaluatedKey {
        userId
        sk
      }
    }
  }`;
