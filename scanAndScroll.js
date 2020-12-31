'use strict'
const fs = require('fs');

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

// Scroll utility
async function * scrollSearch (params) {
  var response = await client.search(params)

  while (true) {
    const sourceHits = response.body.hits.hits

    if (sourceHits.length === 0) {
      break
    }

    for (const hit of sourceHits) {
      yield hit
    }

    if (!response.body._scroll_id) {
      break
    }

    response = await client.scroll({
      scrollId: response.body._scroll_id,
      scroll: params.scroll
    })
  }
}

async function run () {

  let totalAudits = 0;

  const params = {
    index: 'audit',
    scroll: '30s',
    size: 1000,
    body: {
      query: {
        match_all: {}
      }
    }
  }

  for await (const hit of scrollSearch(params)) {
   // console.log(hit._source)
   totalAudits++;
   let data = JSON.stringify(hit._source);
    fs.appendFileSync('audits.json', data);
    fs.appendFileSync('audits.json', '\r\n');
   if(totalAudits % 1000 === 0){
    console.log("total hits: ",totalAudits)
   }
  }
  console.log("total hits: ",totalAudits)
}

run().catch(console.log)

