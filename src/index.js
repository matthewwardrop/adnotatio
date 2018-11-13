'use strict';

import {} from './components/icons';  // Initialise icon library
import Annotatable from './components/annotatable';

import Comment from './comment';
import CommentStorage from './storage/base';
import LocalCommentStorage from './storage/local';
import RemoteCommentStorage from './storage/remote';
import OAuthCommentStorage from './storage/oauth';

import './base.less';

export default Annotatable;
export {
    Comment,
    CommentStorage,
    LocalCommentStorage,
    RemoteCommentStorage,
    OAuthCommentStorage
};
