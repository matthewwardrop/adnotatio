'use strict';

let m;
if (process.env.NODE_ENV !== 'production') {
    m = require('./dist/adnotatio.js');
} else {
    m = require('./dist/adnotatio.min.js');
}

module.exports = {
    default: m.default,
    Comment: m.Comment,
    CommentStorage: m.CommentStorage,
    LocalCommentStorage: m.LocalCommentStorage,
    RemoteCommentStorage: m.RemoteCommentStorage,
    OAuthCommentStorage: m.OAuthCommentStorage
};
