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

  // data bounds
  const upperRight = [lowerLeft[0]+deltaLon,];

  const tHour  = 1000 * 60 * 60
  const tDay   = tHour * 24
  const tWeek  = tDay * 7;
  const tMonth = tDay * 30;

  // heuristic :(
  const areaThreshold = 0.000005;
  

  const locQuery = (options) => {
    const lowerLatitude  = options.lowerLatitude;
    const upperLatitude  = options.upperLatitude;
    const lowerLongitude = options.lowerLongitude;
    const upperLongitude = options.upperLongitude;
    const N              = options.N;


    const bOutsideData   = upperLatitude  < lowerLeft[1] || lowerLatitude  > lowerLeft[1]+deltaLat || 
                           upperLongitude < lowerLeft[0] || lowerLongitude > lowerLeft[0]+deltaLon;
    if (bOutsideData) {
      return [];
    }

    const dLat  = upperLatitude  - lowerLatitude;
    const dLon  = upperLongitude - lowerLongitude;
    const fArea = dLat*dLon;

    // console.log('area',fArea);

    // big query
    if (fArea > areaThreshold) {
      let tStep  = tDay;

      let aResults = [];

      let tDBMin = 1477721364709;
      let tDBMax = 1483710881138;
      // for actual data...
      // const tNow   = Date.now();
      // let tStart   = tNow - tStep;
      // let tEnd     = tNow;
      let tEnd   = tDBMax+1
      let tStart = tEnd - tStep;
      // console.log('db min,max',[tDBMin,tDBMax],'query',[tStart,tEnd]);

      let aData = collection.find({ ts: { $between : [tStart,tEnd] }});
      while (aResults.length < options.N && aData.length) {
        let aInWindow = [];
        for (let i = 0; i < aData.length;i++) {
          let oData = aData[i];
          if (oData.latitude  > lowerLatitude  && oData.latitude  < upperLatitude &&
              oData.longitude > lowerLongitude && oData.longitude < upperLongitude)
          {
            aInWindow.push(oData);
          }
        }
        // console.log('area',fArea,'aInWindow',aInWindow.length,'tStart',tStart,'tEnd',tEnd,'aResults.length',aResults.length);

        // data sorted when returned...
        // aInWindow = aInWindow.sort( (a,b) => b.ts - a.ts );

        let nNeeded = N - aResults.length;
        for (let i = 0;i < nNeeded && i < aInWindow.length;i++) {
          aResults.push(aInWindow[i]);
        }
        // if not done, increase tStep and check again
        if (aResults.length < N) {
          tStep  *= 2;
          tEnd   = tStart;          
          tStart -= tStep;
          aData = collection.find({ ts: { $between : [tStart,tEnd] }});
        }
      }
      // console.log('final size',aResults.length)
      return aResults;
    }
    else { // smaller areas
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

  }

  const NQueries = 1000;
  const halfWinLonScale = 0.04;
  const halfWinLatScale = 0.04;

  const N = 20;

  let t1 = Date.now();

  let aResults = [];
  // let aPromises = [];
  for (let i=0;i < NQueries;i++) {
    const searchLon       = lowerLeft[0] + Math.random() * deltaLon;
    const searchLat       = lowerLeft[1] + Math.random() * deltaLat;
    // const searchLon       = lowerLeft[0] + deltaLon/2;
    // const searchLat       = lowerLeft[1] + deltaLat/2;
    const halfWinLon      = Math.random() * halfWinLonScale;
    const halfWinLat      = Math.random() * halfWinLatScale;
    // const halfWinLon      = halfWinLonScale;
    // const halfWinLat      = halfWinLatScale;

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
