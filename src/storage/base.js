'use strict';

import Comment from '../comment';
import {NotImplementedError} from '../util/errors';

export default class CommentStorage {

    constructor(authority, documentId, documentVersion, documentMetadata) {
        this.comments = []
        this.staged = []

        this.context = {
            authority: authority,
            documentId: documentId,
            documentVersion: documentVersion,
            documentMetadata: documentMetadata
        }
    }

    connect = (onUpdateCallback) => {
        throw new NotImplementedError();
    }

    disconnect = () => {
        throw new NotImplementedError();
    }

    load = () => {
        throw new NotImplementedError();
    }

    sync = (force=false) => {
        throw new NotImplementedError();
    }

    get = (uuid) => {
        uuid = this._get_uuid(uuid);
        for (let i = 0; i < this.comments.length; i++) {
            let comment = this.comments[i];
            if (comment.uuid == uuid) {
                return comment;
            }
        }
        return null;
    }

    exists = (uuid) => {
        uuid = this._get_uuid(uuid);
        for (let i = 0; i < this.comments.length; i++) {
            let comment = this.comments[i];
            if (comment.uuid == uuid) {
                return true;
            }
        }
        return null;
    }

    update = (comment) => {
        throw new NotImplementedError();
    }

    add = (comment) => {
        throw new NotImplementedError();
    }

    resolve = (uuid) => {
        throw new NotImplementedError();
    }

    archive = (uuid) => {
        throw new NotImplementedError();
    }

    // Drafts

    stage = (comment) => {
        let index = this._get_comment_index(comment, this.staged);

        if (index > -1) {
            throw new CommentAlreadyExists(comment.uuid);
        }
        comment.isDraft = true;
        this.staged.push(comment);

        this.sync(true);
    }

    commit = (uuid) => {
        uuid = this._get_uuid(uuid);
        let index = this._get_comment_index(uuid, this.staged);

        if (index == -1) {
            throw new CommentDoesNotExist(comment.uuid);
        }

        let comment = this.staged[index];

        this.discard(comment)
        this.add(comment)
    }

    discard = (uuid) => {
        uuid = this._get_uuid(uuid);
        let index = this._get_comment_index(uuid, this.staged);

        if (index == -1) {
            throw new CommentDoesNotExist(comment.uuid);
        }

        this.staged.splice( index, 1 )
        this.sync(true);
    }

    _get_uuid = (comment_uuid) => {
        return comment_uuid instanceof Comment ? comment_uuid.uuid : comment_uuid;
    }

    _get_comment_index = (comment_uuid, comments=null) => {
        comments = comments || this.comments;
        comment_uuid = this._get_uuid(comment_uuid);
        for (let i = 0; i < comments.length; i++) {
            let comment = comments[i];
            if (comment.uuid == comment_uuid) return i;
        }
        return -1;
    }

}
