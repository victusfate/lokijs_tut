'use strict';

const loki  = require('lokijs');
const db    = new loki('loki.json');

const sCollection = 'incidents';

const t0 = Date.now();

// Get the documents collection
let collection = db.addCollection(sCollection, {
  unique:  ['id']
  // indices: ['ts','latitude','longitude']
});

// add index
// collection.createIndex({ ts: 1, loc: "2dsphere" });
collection.ensureIndex('ts');
collection.ensureIndex('latitude');
collection.ensureIndex('longitude')

const N         = 100000;
const center    = [-73.993549, 40.727248];
const lowerLeft = [-74.009180, 40.716425];
const deltaLon  = Math.abs(center[0] - lowerLeft[0]);
const deltaLat  = Math.abs(center[1] - lowerLeft[1]);
let   tPrevious = 1475431264754;

let aData = [];
for (let i = 0; i < N; i++) {
  const incidentLon = lowerLeft[0] + Math.random() * deltaLon;
  const incidentLat = lowerLeft[1] + Math.random() * deltaLat;
  tPrevious         += Math.floor(Math.random() * 60 * 1000); // random time after previous
  const oIncident = { id: '-k'+i, latitude: incidentLat, longitude: incidentLon, ts: tPrevious };
  collection.insert(oIncident);
}
const t1 = Date.now();
console.log('before saving',t1-t0);
// console.log(collection.data)

db.saveDatabase( (err) => {
  if (err) {
    throw err;
  }
  console.log('saved',Date.now()-t1);
  process.exit(0);

  // const db2 = new loki('loki.json');
  // db2.loadDatabase({}, function (err) {
  //   if (err) {
  //     throw err;
  //   }

  //   else {
  //     console.log('reloaded db after saving/loading')
  //     console.log(db2.getCollection(sCollection).data)
  //   }
  // });
})

