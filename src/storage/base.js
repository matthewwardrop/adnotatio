'use strict';

import Comment from '../comment';
import {CommentAlreadyExists, CommentDoesNotExist, NotImplementedError} from '../utils/errors';


class CommentCache {

    static fromCache(cache) {
        let newCache = new CommentCache();
        cache.toArray().forEach(comment => newCache.add_or_update(comment));
        return newCache;
    }

    constructor() {
        this.comments = {}
    }

    clear = () => {
        this.comments = {};
    }

    has = (uuid) => {
        return this.comments.hasOwnProperty(uuid);
    }

    add_or_update = (comment) => {
        this.comments[comment.uuid] = comment;
    }

    get = (uuid) => {
        return this.comments[uuid];
    }

    toArray = () => {
        return Object.values(this.comments);
    }

    pop = (uuid) => {
        try {
            return this.comments[uuid];
        } finally {
            delete this.comments[uuid];
        }
    }

    union = (otherCache) => {
        otherCache.toArray().forEach(comment => this.add_or_update(comment));
    }

}


export default class CommentStorage {

    constructor(authority, documentId, documentVersion, documentMetadata) {
        this._cache = new CommentCache();
        this._stage = new CommentCache();
        this.context = null;
        this.notifyCallback = null;
    }

    connect = (context, callback) => {
        this.context = context,
        this.notifyCallback = callback;
        this.onConnect();
        this.load();
    }

    disconnect = () => {
        this.context = null;
        this.notifyCallback = null;
        this.onDisconnect();
    }

    // Event handlers
    notify = () => {
        if (this.notifyCallback) {
            let comments = CommentCache.fromCache(this._cache);
            comments.union(this._stage);
            this.notifyCallback(comments.toArray());
        }
    }

    // Imperative actions

    load = () => {
        this.onLoad((comments) => {
            this._cache.clear();
            comments.forEach(comment => {
                this._cache.add_or_update(comment);
            })
            this.notify();
        })
    }

    sync = () => {
        this.onSync((newComments) => {
            newComments.forEach(comment => {
                this._cache.add_or_update(comment);
            });
            this.notify();
        });
    }

    get = (uuid) => {
        uuid = this._get_uuid(uuid);
        return this._stage.get(uuid) || this._cache.get(uuid);
    }

    exists = (uuid) => {
        uuid = this._get_uuid(uuid);
        return this._stage.has(uuid) || this._cache.has(uuid);
    }

    add = (comment) => {
        if (this._cache.has(comment)) throw new CommentAlreadyExists(comment.uuid);

        comment.isDraft = false;
        this._stage.add_or_update(comment);

        this.onSubmit(comment, (success) => {
            if (success) {
                this._cache.add_or_update(comment);
                this._stage.pop(comment.uuid);
                this.notify();
            }
        })
    }

    update = (comment) => {
        if (!this.exists(comment)) throw new CommentDoesNotExist(comment.uuid);

        this._stage.add_or_update(comment);

        this.add(comment);
    }

    // Drafts

    create = (state) => {
        return new Comment({context: this.context, ...state});
    }

    stage = (comment) => {
        comment.isDraft = true;
        this._stage.add_or_update(comment);
        this.notify();
    }

    commit = (uuid) => {
        uuid = this._get_uuid(uuid);
        let comment = this._stage.get(uuid);

        if (!comment) throw new CommentDoesNotExist(uuid);

        return this.add(comment);
    }

    discard = (uuid) => {
        uuid = this._get_uuid(uuid);
        let comment = this._stage.get(uuid);

        if (!comment) throw new CommentDoesNotExist(uuid);

        this._stage.pop(uuid);
        this.notify();
    }

    _get_uuid = (comment_uuid) => {
        return comment_uuid instanceof Comment ? comment_uuid.uuid : comment_uuid;
    }

    // Hooks for subclasses to modify behaviour
    onConnect = () => {}
    onDisconnect = () => {}

    onLoad = (callback) => {}
    onSync = (callback) => {}
    onSubmit = (comment, callback) => {}

}
