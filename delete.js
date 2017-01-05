'use strict';

const loki    = require('lokijs');
const db      = new loki('loki.json');

const sCollection = 'incidents';

db.loadDatabase({}, function (err) {
  if (err) {
    throw err;
  }

  let collection = db.getCollection(sCollection);
  collection.chain().remove();
  console.log('after removal but before persisting')
  console.log(collection.data)
  db.saveDatabase( err => {
    if (err) {
      throw err;
    }

    const db2 = new loki('loki.json');
    db2.loadDatabase({}, function (err) {
      if (err) {
        throw err;
      }
      console.log('after removal and persisting')
      console.log(db2.getCollection(sCollection).data)
    });


  });
});

