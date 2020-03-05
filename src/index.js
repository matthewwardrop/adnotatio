import './base.less';
import Annotatable from './components/annotatable';
import Annotation from './annotations/base';
import Comment from './comment';
import CommentStorage from './storage/base';
import LocalCommentStorage from './storage/local';
import OAuthCommentStorage from './storage/oauth';
import RemoteCommentStorage from './storage/remote';

export default Annotatable;
export {
    Annotation,
    Comment,
    CommentStorage,
    LocalCommentStorage,
    OAuthCommentStorage,
    RemoteCommentStorage,
};
