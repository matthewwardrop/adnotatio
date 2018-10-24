'use strict';

import Comment from '../comment';
import CommentStorage from './base';
import {CommentAlreadyExists, CommentDoesNotExist} from '../util/errors';

export default class LocalCommentStorage extends CommentStorage {

    onConnect = () => {
        window.addEventListener('storage', this.sync);
    }

    onDisconnect = () => {
        window.removeEventListener('storage', this.sync);
    }

    onLoad = (callback) => {
        let comments = (
            (JSON.parse(window.localStorage.getItem('comments')) || [])
            .map(comment => {return Comment.fromJSON(comment)})
        );
        callback(comments);
    }

    onSync = (callback) => {
        let comments = (
            (JSON.parse(window.localStorage.getItem('comments')) || [])
            .map(comment => {return Comment.fromJSON(comment)})
        );
        callback(comments);
    }

    onSubmit = (comment, callback) => {
        let comments = this._cache.toArray().concat([comment]);
        window.localStorage.setItem('comments', JSON.stringify(comments));
        callback(true);
    }

}
