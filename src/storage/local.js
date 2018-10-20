'use strict';

import Comment from '../comment';
import CommentStorage from './base';
import {CommentAlreadyExists, CommentDoesNotExist} from '../util/errors';

export default class LocalCommentStorage extends CommentStorage {

    connect = (onUpdateCallback) => {
        if (onUpdateCallback) {
            this.onUpdateCallback = onUpdateCallback;
            this.sync();
            window.addEventListener('storage', this.sync);
        }
    }

    disconnect = () => {
        if (this.onUpdateCallback) {
            //clearInterval(this.update_timer);
            window.removeEventListener('storage', this.sync);
            delete this.onUpdateCallback;
        }
    }

    load = () => {
        let comments = (JSON.parse(window.localStorage.getItem('comments')) || []);
        this.comments = comments.map(comment => {return Comment.fromJSON(comment)});
        return this.comments;
    }

    sync = (force=false) => {
        if (force || this.isOutdated) {
            let comments = this.load();
            if (this.onUpdateCallback) {
                this.onUpdateCallback(comments.concat(this.staged));
            }
        }
    }

    add = (comment) => {
        let index = this._get_comment_index(comment);

        if (index > -1) {
            throw new CommentAlreadyExists(comment.uuid);
        }

        try {
            this.discard(comment);
        } catch {

        }

        comment.isDraft = false;

        this.comments.push(comment);

        this.save(this.comments);
        this.sync(true);
    }

    update = (comment) => {
        let index = this._get_comment_index(comment);

        if (index == -1) {
            throw new CommentDoesNotExist(comment.uuid);
        } else {
            this.comments.splice( index, 1 )
        }
        this.comments.push(comment);
        comment.isDraft = false;

        this.save(this.comments);
        this.sync(true);
    }

    // resolve = (uuid) => {
    //
    // }
    //
    // archive = (uuid) => {
    //
    // }

    save = (comments) => {
        window.localStorage.setItem('comments', JSON.stringify(comments))
    }

    get isOutdated() {
        return window.localStorage.getItem('comments') != JSON.stringify(this.comments);
    }

}
