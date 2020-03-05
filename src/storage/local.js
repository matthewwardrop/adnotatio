'use strict';

import Comment from '../comment';
import CommentStorage from './base';
import {CommentAlreadyExists, CommentDoesNotExist} from '../utils/errors';

export default class LocalCommentStorage extends CommentStorage {

    onConnect = () => {
        window.addEventListener('storage', this.sync);
    }

    onDisconnect = () => {
        window.removeEventListener('storage', this.sync);
    }

    onLoad = () => {
        let comments = (
            (JSON.parse(window.localStorage.getItem('comments')) || [])
            .map(comment => {return Comment.fromJSON(comment, this.annotationFactory)})
        );
        return comments;
    }

    onSync = () => {
        let comments = (
            (JSON.parse(window.localStorage.getItem('comments')) || [])
            .map(comment => {return Comment.fromJSON(comment, this.annotationFactory)})
        );
        return comments;
    }

    onSubmit = (comment) => {
        let comments = this._cache.toArray().concat([comment]);
        window.localStorage.setItem('comments', JSON.stringify(comments));
        return true;
    }

    onPatch = (uuid, patch) => {
        throw "Not implemented.";
    }

}
