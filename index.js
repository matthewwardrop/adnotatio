let m;
if (process.env.NODE_ENV !== 'production') {
    m = require('./dist/adnotatio.js');
} else {
    m = require('./dist/adnotatio.min.js');
}

module.exports = {
    __esModule: true,
    default: m.default,
    Annotation: m.Annotation,
    Comment: m.Comment,
    CommentStorage: m.CommentStorage,
    LocalCommentStorage: m.LocalCommentStorage,
    OAuthCommentStorage: m.OAuthCommentStorage,
    RemoteCommentStorage: m.RemoteCommentStorage,
};
