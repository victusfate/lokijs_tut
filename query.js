'use strict';

const loki  = require('lokijs');
const db    = new loki('loki.json');

const sCollection = 'incidents';

db.loadDatabase({}, function (err) {

  if (err) {
    throw err;
  }

  // Get the documents collection
  let collection = db.getCollection(sCollection);

  const t0 = Date.now();

  const center    = [-73.993549, 40.727248];
  const lowerLeft = [-74.009180, 40.716425];
  const deltaLon  = 2 * Math.abs(center[0] - lowerLeft[0]);
  const deltaLat  = 2 * Math.abs(center[1] - lowerLeft[1]);


  const locQuery = (options) => {  
    return collection.chain().find({ 
      $and: [
        {
          latitude  : { 
            $between: [options.lowerLatitude,options.upperLatitude] 
          }        
        },
        {
          longitude  : { 
            $between: [options.lowerLongitude,options.upperLongitude] 
          }        
        },
      ]
    }).simplesort('ts',true).limit(options.N).data();
  }

  const NQueries = 100;
  const halfWinLonScale = 0.04;
  const halfWinLatScale = 0.04;

  const N = 20;

  let t1 = Date.now();

  let aResults = [];
  // let aPromises = [];
  for (let i=0;i < NQueries;i++) {
    const searchLon       = lowerLeft[0] + Math.random() * deltaLon;
    const searchLat       = lowerLeft[1] + Math.random() * deltaLat;
    const halfWinLon      = Math.random() * halfWinLonScale;
    const halfWinLat      = Math.random() * halfWinLatScale;

    const lowerLatitude   = searchLat - halfWinLat;
    const lowerLongitude  = searchLon - halfWinLon;
    const upperLatitude   = searchLat + halfWinLat;
    const upperLongitude  = searchLon + halfWinLon;

    // console.log('search args', lowerLatitude,lowerLongitude,upperLatitude,upperLongitude,N)

    aResults.push(locQuery({
      lowerLatitude   : lowerLatitude,
      lowerLongitude  : lowerLongitude,
      upperLatitude   : upperLatitude,
      upperLongitude  : upperLongitude,
      N               : N
    }));

  }

  let t2 = Date.now();
  console.log({ queriesTimeMS: t2-t1, queriesPerSecond: NQueries / ( (t2-t1)/1000 ) })
  // for (let ind=0;ind < aResults.length;ind++) {
    let ind = aResults.length - 1;
    console.log('iQuery',ind);
    for (let j=0;j < aResults[ind].length;j++) {
      console.log(aResults[ind][j].id,aResults[ind][j].ts,aResults[ind][j].latitude,aResults[ind][j].longitude)
    }    
  // }

});
