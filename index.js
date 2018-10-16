'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/adnotatio.min.js');
} else {
  module.exports = require('./dist/adnotatio.js');
}
