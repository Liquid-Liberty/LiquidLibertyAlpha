# GraphQL Test Queries for OnFinality Endpoint

## Endpoint
```
https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart
```

## 1. Check Indexing Status
```graphql
query {
  _metadata {
    lastProcessedHeight
    targetHeight
    chain
    specName
    genesisHash
  }
}
```

## 2. Check Latest Candles (Most Important)
```graphql
query {
  candles(first: 10, orderBy: BUCKET_START_DESC) {
    nodes {
      id
      pairId
      interval
      bucketStart
      open
      high
      low
      close
      volumeToken0
      volumeToken1
      trades
    }
  }
}
```

## 3. Check Candles from Your Transaction Block
```graphql
query {
  candles(
    filter: {
      bucketStart: { greaterThan: 1726588020 }  # Around your transaction time
    }
    orderBy: BUCKET_START_DESC
  ) {
    nodes {
      id
      pairId
      interval
      bucketStart
      open
      high
      low
      close
      volumeToken0
      volumeToken1
      trades
    }
  }
}
```

## 4. Check All Pairs
```graphql
query {
  pairs {
    nodes {
      id
      token0Id
      token1Id
      createdAt
    }
  }
}
```

## 5. Check All Tokens
```graphql
query {
  tokens {
    nodes {
      id
      symbol
      name
      decimals
    }
  }
}
```

## 6. Check Candles for Specific Intervals
```graphql
query {
  candles(
    filter: {
      interval: { equalTo: "60" }  # 1-minute candles
    }
    first: 5
    orderBy: BUCKET_START_DESC
  ) {
    nodes {
      id
      bucketStart
      open
      high
      low
      close
      volumeToken0
      volumeToken1
      trades
    }
  }
}
```

## 7. Search for Your Transaction Block Range
```graphql
query {
  candles(
    filter: {
      AND: [
        { bucketStart: { greaterThan: 1726587600 } }  # 10 minutes before
        { bucketStart: { lessThan: 1726588800 } }     # 10 minutes after
      ]
    }
    orderBy: BUCKET_START_DESC
  ) {
    nodes {
      id
      interval
      bucketStart
      close
      trades
    }
  }
}
```

---

## How to Test:

1. **Go to**: https://index-api.onfinality.io/sq/Liquid-Liberty/pulse-lmkt-chart
2. **Use GraphQL Playground** (if available) or any GraphQL client
3. **Start with Query #1** to check indexing status
4. **Run Query #2** to see if any candles exist
5. **If candles exist**, your data is there and the frontend issue is elsewhere
6. **If no candles**, check the SubQuery logs for processing errors

## Expected Results:

If working correctly, you should see:
- **Query #1**: `lastProcessedHeight` should be ≥ 22654608
- **Query #2**: At least some candle data
- **Candles should have**: `trades > 0`, valid OHLC prices, volumes

Let me know what these queries return!