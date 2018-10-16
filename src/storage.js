'use strict';

import Comment from './comment';

export default class CommentStorage {

    constructor() {
        this.comments = []
        this.onUpdateCallback = null;
    }

    connect = (onUpdateCallback) => {
        if (onUpdateCallback) {
            this.onUpdateCallback = onUpdateCallback;
            this.sync();
            // this.update_timer = setInterval(
            //     () => this.sync(),
            //     1000
            // );
            window.addEventListener('storage', this.sync);
        }
    }

    disconnect = () => {
        if (this.onUpdateCallback) {
            //clearInterval(this.update_timer);
            window.removeEventListener('storage', this.sync);
            this.onUpdateCallback = null;
        }
    }

    load = () => {
        let comments = (JSON.parse(window.localStorage.getItem('comments')) || []);
        this.comments = comments.map(comment => {return Comment.fromJSON(comment)});
        return this.comments;
    }

    save = (comments) => {
        window.localStorage.setItem('comments', JSON.stringify(comments))
    }

    sync = (force=false) => {
        if (force || this.isOutdated) {
            let comments = this.load();
            if (this.onUpdateCallback) {
                this.onUpdateCallback(comments);
            }
        }
    }

    get isOutdated() {
        return window.localStorage.getItem('comments') != JSON.stringify(this.comments);
    }

    has_comment = (comment_uuid) => {
        for (let i = 0; i < this.comments.length; i++) {
            let comment = this.comments[i];
            if (comment.uuid == comment_uuid) {
                return true;
            }
        }
        return null;
    }

    get_comment = (comment_uuid) => {
        for (let i = 0; i < this.comments.length; i++) {
            let comment = this.comments[i];
            if (comment.uuid == comment_uuid) {
                return comment;
            }
        }
        return null;
    }

    _get_comment_index = (comment_uuid) => {
        if (comment_uuid instanceof Comment) {
            comment_uuid = comment_uuid.uuid;
        }
        for (let i = 0; i < this.comments.length; i++) {
            let comment = this.comments[i];
            console.log('comment_index', console.uuid, comment_uuid)
            if (comment.uuid == comment_uuid) return i;
        }
        return -1;
    }

    submit = (comment) => {
        let index = this._get_comment_index(comment);

        if (index > -1) {
            this.comments.splice( index, 1 )
        }
        this.comments.push(comment);

        this.save(this.comments);
        this.sync(true);
    }

}
